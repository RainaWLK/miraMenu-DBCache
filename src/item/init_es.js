let db = require('../common/dynamodb.js');
let es = require('../common/elasticsearch.js');
let item = require('./update.js');
let _ = require('lodash');

let SourceTable = "ItemsB2C";

const ES_INDEX = "items";
const ES_FIELD = "item_search";


async function createEsIndex(){
  let chinese_analyzer = {
    type: 'text',
    analyzer: 'ik_smart'
  };
  
  let body = {
    properties: {
      id: {
        type: "keyword"
      },
      item_id: {
        type: "keyword"
      },
      restaurant_name: chinese_analyzer,
      branch_name: chinese_analyzer,
      name: chinese_analyzer,
      category: chinese_analyzer,
      desc: chinese_analyzer
    }
  };

  return await es.initIndex(ES_INDEX, ES_FIELD, body);
}

async function updateEsIndex(destDataArray) {
  let esArray = destDataArray.map(element => item.makeEsData(element));
  return await es.updateIndex(ES_INDEX, ES_FIELD, esArray);
}

async function getSourceData(table){
  let dataArray = await db.scan(table);
  
  //for debug
  //dataArray = dataArray.filter(element => element.item_id==='r20170041s1i1506276138595');

  return dataArray;
}

async function go(){
  //init elasticsearch
  try {
    await createEsIndex();

    let dataArray = await getSourceData(SourceTable);
    return await updateEsIndex(dataArray);
  }
  catch(err) {
    throw err;
  }
}

exports.go = go;
