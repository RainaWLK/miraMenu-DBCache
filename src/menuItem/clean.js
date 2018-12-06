const db = require('../common/dynamodb.js');
const utils = require('../common/utils.js');
let es = require('../common/elasticsearch.js');
let _ = require('lodash');

async function getIdDelete(newData, restaurant_id) {
  try {
    let body = {
      size: 9999,
      from: 0,
      "query": {
        "term" : {
          "restaurant_id" : restaurant_id
        }
      },
      sort: [
        { "restaurant_id": "desc" },
        "_score"
      ]
    };
    
  
    let response = await es.simpleSearch("menuitem_new", body);
    console.log('newData=');
    console.log(newData);
    console.log('esData=');
    console.log(response.hits.hits);
    //search non-existed
    let id_delete = response.hits.hits.filter(element => {
      if(newData.find(e => e.item_id === element._source.item_id) === undefined) {
        return true;
      }
      return false;
    }).map(e => e._source.item_id);
    console.log('id_delete=');
    console.log(id_delete);

    return id_delete;
  }
  catch(err) {
    //if(err.statusCode === 404) {
    //  console.log('no data need to be clean, skip');
    //  return;
    //}
    console.error(err);
    throw err;
  }

}

async function clean(id_delete) {
  try {
    for(let i in id_delete) {
      console.log('delete es:'+id_delete[i]);
      await es.deleteIndex('menuitem_new', 'menuItem_search', id_delete[i]);
    }
    return;
  }
  catch(err) {
    console.error(err);
    throw err;
  }
}


async function go(newData, restaurant_id) {
  try {
    let id_delete = await getIdDelete(newData, restaurant_id);
    await clean(id_delete);
  }
  catch(err) {
    throw err;
  }
}

exports.go = go;

//for test
exports.getIdDelete = getIdDelete;