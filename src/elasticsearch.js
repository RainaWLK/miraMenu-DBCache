const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
  //hosts: [ 'https://vpc-miramenu-mbynmdnepcr7oxinykkzoi6qdy.us-west-2.es.amazonaws.com']
  hosts: [ 'http://ip-172-31-11-6.us-west-2.compute.internal:9200' ]
});
let connected = false;

function checkConnection() {
  return new Promise((resolve, reject) => {
    if(connected){
      resolve();
    }
    else {
      esClient.ping({
        requestTimeout: 30000,
      }, (error) => {
        if (error) {
           console.error('elasticsearch cluster is down!');
           reject();
        } else {
           console.log('Everything is ok');
           resolve();
        }
      });
    }
  });

}

async function createIndex(index, type, schema, data) {

  
  try {
    await checkConnection();
    console.log("====purge====");
    let result1 = await esClient.indices.delete({
      index: index
    });
    console.log(result1);
  }
  catch(err) {
    console.error(err);
  }
    
  try {
    console.log("====create====");
    let result2 = await esClient.indices.create({
      index: index
    });
    console.log(result2);
    
    let result = await esClient.indices.putMapping({
      index : index,
      type : type,
      body: schema
    });
    console.log('elasticsearch putMapping done');
    console.log(result);
    
    await bulkIndex(index, type, data);
    return;
  }
  catch(err) {
    console.error('elasticsearch error');
    console.error(err);
    throw err;
  }
}

async function bulkIndex(index, type, data) {
  let bulkBody = [];

  data.forEach(item => {
    bulkBody.push({
      index: {
        _index: index,
        _type: type,
        _id: item.id
      }
    });

    bulkBody.push(item);
  });

  try {
    await checkConnection();
    let response = await esClient.bulk({body: bulkBody});
    let errorCount = 0;
    response.items.forEach(item => {
      if (item.index && item.index.error) {
        console.log(++errorCount, item.index.error);
        console.log(item);
      }
    });
    console.log(
      `Successfully indexed ${data.length - errorCount}
       out of ${data.length} items`
    );
    
    await indices();
    return;
  }
  catch(err) {
    console.err(err);
    throw err;
  }
};

function indices() {
  return esClient.cat.indices({v: true})
  .then(console.log)
  .catch(err => console.error(`Error connecting to the es client: ${err}`));
};

async function search(index, body) {
  try {
    await checkConnection();
    let response = await esClient.search({index: index, body: body});
    console.log(`found ${response.hits.total} items in ${response.took}ms`);
    console.log(`returned article titles:`);
    let result = response.hits.hits.map(
      (hit, index) => {
        console.log(`\t${body.from + ++index} - ${hit._source.id}`);
        return hit._source.id;
    })
    console.log(result);
    return result;
  }
  catch(err) {
    console.err(err);
    throw err;
  }
}

async function test(){
  let INDEX = 'library';
  await createIndex('branches', []);
  await indices();
  
  return esClient.indices.getMapping({
    index: INDEX,
    type: 'branches'
  }).then(results => {
    console.log(results[INDEX].mappings['branches']);
  });
  
  
  let body = {
    size: 20,
    from: 0,
    query: {
      multi_match: {
        query: 'deer',
        fields: ['restaurant_name', 'branch_name',  'category'],
        fuzziness: 2
      }
    }
  };

  /*return esClient.search({index: 'library', body: body})
  .then(results => {
    console.log(`found ${results.hits.total} items in ${results.took}ms`);
    console.log(`returned article titles:`);
    results.hits.hits.forEach(
      (hit, index) => console.log(
        `\t${body.from + ++index} - ${hit._source.id}`
      )
    )
  })
  .catch(err => {
    console.log('err');
    console.error(err);
  });*/
}


exports.createIndex = createIndex;
exports.test = test;
exports.search = search;


/*
client.indices.putMapping({
    index : 'test',
    type : 'branches',
    body : {
        branches: {
            properties: {
                title: {
                    type: 'string',
                    term_vector: 'with_positions_offsets',
                    analyzer: 'ik_syno',
                    search_analyzer: 'ik_syno',
                },
                content: {
                    type: 'string',
                    term_vector: 'with_positions_offsets',
                    analyzer: 'ik_syno',
                    search_analyzer: 'ik_syno',
                },
                slug: {
                    type: 'string',
                },
                tags: {
                    type: 'string',
                    index : 'not_analyzed',
                },
                update_date: {
                    type : 'date',
                    index : 'not_analyzed',
                }
            }
        }
    }
});

*/