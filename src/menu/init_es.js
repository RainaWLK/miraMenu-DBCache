let db = require('../common/dynamodb.js');
let es = require('../common/elasticsearch.js');
let menu = require('./update.js');
let _ = require('lodash');

let SourceTable = "MenusB2C";

const ES_INDEX = "menus";
const ES_FIELD = "menu_search";


async function createEsIndex(){
  let chinese_analyzer = {
    type: 'text',
    analyzer: 'ik_smart'
    //search_analyzer: 'ik_smart'
  };
  
  let body = {
    properties: {
      id: {
        type: "keyword"
      },
      menu_id: {
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

async function createMenuItemIndex() {
  let analyzer = {
    type: 'text',
    analyzer: 'standard'
    //search_analyzer: 'standard'
  };
  let body = {
    properties: {
      menu_id: {
        "type": "keyword"
      },
      item_id: {
        "type": "keyword"
      },
      section_name: analyzer
    }
  };

  return await es.initIndex('menuitem', 'menuItem_search', body);
}

function makeEsData(src) {
  let output = _.cloneDeep(src);
  
  delete output.i18n;
  delete output.photos;
  delete output.menuControl;
  delete output.resources;
  
  return output;
}

async function updateEsIndex(destDataArray) {
  await menu.updateEsIndex_MenuItem(destDataArray);
  
  let esArray = destDataArray.map(element => makeEsData(element));
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
    await createMenuItemIndex();

    let dataArray = await getSourceData(SourceTable);
    return await updateEsIndex(dataArray);
  }
  catch(err) {
    throw err;
  }
}

exports.go = go;
