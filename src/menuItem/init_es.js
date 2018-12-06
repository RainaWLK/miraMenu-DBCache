let db = require('../common/dynamodb.js');
let es = require('../common/elasticsearch.js');
let menuItem = require('./update.js');
let _ = require('lodash');

async function createEsIndex() {
  let analyzer = {
    type: 'text',
    analyzer: 'standard'
    //search_analyzer: 'standard'
  };
  let body = {
    properties: {
      id: {
        "type": "keyword"
      },
      item_id: {
        "type": "keyword"
      },
      restaurant_id: {
        "type": "keyword"
      }
    }
  };

  return await es.initIndex('menuitem_new', 'menuItem_search', body);
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

    let dataArray = await getSourceData('Restaurants');
    
    for(let i in dataArray) {
      await menuItem.update(dataArray[i].id);
    }
  }
  catch(err) {
    throw err;
  }
}

exports.go = go;
