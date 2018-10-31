let _ = require('lodash');
const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
  //aws elasticsearch
  //hosts: [ 'https://vpc-miramenu-mbynmdnepcr7oxinykkzoi6qdy.us-west-2.es.amazonaws.com']
  //ECS ALB
  hosts: [ 'http://internal-es-alb-1720960170.us-west-2.elb.amazonaws.com:9200' ]
  //Local
  //hosts: [ 'http://34.212.234.43:9200' ]
});

function sleep(wait = 0) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, wait);
  })
};

async function connect() {
  let retry = 5;
  
  while(retry > 0) {
    console.log('retry:' + retry);
    try {
      await checkConnection();
      return;
    }
    catch(err) {
      retry--;
      await sleep(10000);
    }
  }
  return;
}

function checkConnection() {
  let start_time = Date.now();
  
  return new Promise((resolve, reject) => {
    esClient.cluster.health({
      waitForStatus: 'yellow'
    }, (err) => {
      if(err) {
        console.error('elasticsearch cluster is down!');
        reject(err);
        return;
      }
      
      console.log(`elasticsearch ready: ${Date.now() - start_time} ms`);
      resolve();
    });
  });

}

async function initIndex(index, type, schema) {
  try {
    await connect();
    let params = {
      index: index
    };
    console.log("====check existed====");
    let index_existed = await esClient.indices.exists(params);

    if(index_existed) {
      console.log("====purge====");
      let result1 = await esClient.indices.delete(params);
      console.log(result1);
      console.log("====purge done====");
    }

    console.log("====create====");
    let result2 = await esClient.indices.create(params);
    //console.log(result2);
    console.log("====create done====");
    
    console.log("====put mapping====");
    let result = await esClient.indices.putMapping({
      index : index,
      type : type,
      body: schema
    });
    console.log('==== putMapping done ====');
    //console.log(result);

    return esClient;
  }
  catch(err) {
    console.error('elasticsearch error');
    console.error(err);
    throw err;
  }
}

async function updateIndex(index, type, data) {
  let bulkBody = [];
  
  if(_.isEmpty(data)) {
    return { errors: false };
  }
  
  const insertBulk = (element) => {
    bulkBody.push({
      index: {
        _index: index,
        _type: type,
        _id: element.id
      }
    });
  
    bulkBody.push(element);
  };
  
  if(Array.isArray(data)) {
    data.forEach(element => insertBulk(element));    
  }
  else {
    insertBulk(data);
  }
  
  try {
    await checkConnection();
    let response = await esClient.bulk({body: bulkBody});
    
    let errorCount = 0;
    response.items.forEach(item => {
      if (item.index && item.index.error) {
        console.log('updateIndex error');
        console.log(++errorCount, item.index.error);
        console.log(item);
      }
    });
    console.log(
      `Successfully update ${bulkBody.length/2 - errorCount}
       out of ${bulkBody.length/2} items`
    );

    return response;
  }
  catch(err) {
    console.error(err);
    throw err;
  }
}

async function deleteIndice(index) {
  try {
    console.log("====purge====");
    let result1 = await esClient.indices.delete({
      index: index
    });
    console.log(result1);
    console.log("====purge done====");
  }
  catch(err) {
    console.error(err);
    throw err;
  }
}

async function getIndex(index, type, id) {
  try {
    const response = await esClient.get({
      index: index,
      type: type,
      id: id
    });
    return response._source;
  }
  catch(err) {
    console.error(err);
    throw err;
  }

}

async function deleteIndex(index, type, id) {
  try {
    let params = {
      index: index,
      type: type,
      id: id     
    };
    let response = null;
    const exists = await esClient.exists(params);
    console.log('exists='+exists);
    if(exists) {
      response = await esClient.delete(params);
    }
    return response;
  }
  catch(err) {
    console.error(err);
    throw err;
  }
}

function indices() {
  return esClient.cat.indices({v: true})
  .then(console.log)
  .catch(err => console.error(`Error connecting to the es client: ${err}`));
};

async function simpleSearch(index, body) {
  try {
    await checkConnection();
    let response = await esClient.search({index: index, body: body});
    return response;
  }
  catch(err) {
    console.error(err);
    throw err;
  }
}

async function search(index, body) {
  try {
    await checkConnection();
    console.log(`keyword: ${body.query.multi_match.query}`);
    let response = await esClient.search({index: index, body: body});
    console.log(`found ${response.hits.total} items in ${response.took}ms`);
    let result = response.hits.hits.filter((hit, index) => {
      //log
      let output_log = `${body.from + ++index} - ${hit._source.id} - `;
      
      body.query.multi_match.fields.forEach(fields => {
        output_log += `${hit._source[fields]} : `;
      });
      output_log += ` - ${hit._score}`;
      console.log(output_log);
      return hit._score > 0;
    }).map(hit => {
        return {
          _source: hit._source,
          score: hit._score
        }
    });
    
    //sort
    return result.sort((a,b) => {
      return a.score - b.score
    }).map(a => a._source);
  }
  catch(err) {
    console.error(err);
    throw err;
  }
}

exports.initIndex = initIndex;
exports.getIndex = getIndex;
exports.updateIndex = updateIndex;
exports.deleteIndex = deleteIndex;
exports.deleteIndice = deleteIndice;
exports.simpleSearch = simpleSearch;
exports.search = search;

exports.checkConnection = checkConnection;