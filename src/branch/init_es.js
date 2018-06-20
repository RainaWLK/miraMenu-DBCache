let db = require('../common/dynamodb.js');
let es = require('../common/elasticsearch.js');
let _ = require('lodash');

let SourceTable = "BranchesB2C";

async function createEsIndex(){
  let body = {
    properties: {
      restaurant_name: {
        type: 'text',
        "analyzer": "ik_smart",
        "search_analyzer": "ik_smart"
      },
      branch_name: {
        type: 'text',
        "analyzer": "ik_smart",
        "search_analyzer": "ik_smart"
      },
      category: {
        type: 'text',
        "analyzer": "ik_smart",
        "search_analyzer": "ik_smart"
      },
      address: {
        type: 'text',
        "analyzer": "ik_smart",
        "search_analyzer": "ik_smart"
      }
    }
  };

  return await es.initIndex('branches', 'branch_search', body);
}

function makeEsData(src) {
  let output = _.cloneDeep(src);
  
  delete output.i18n;
  delete output.photos;
  delete output.branchControl;
  delete output.resources;
  delete output.floor_plan;
  delete output.tables;
  delete output.qrcode;
  delete output.social;
  
  return output;
}

async function updateEsIndex(destDataArray) {
  let esArray = destDataArray.map(element => makeEsData(element));
  return await es.updateIndex('branches', 'branch_search', esArray);
}

async function getSourceData(table){
  let dataArray = await db.scan(table);
  
  return dataArray;
}

async function go(){
  //init elasticsearch
  createEsIndex();

  let dataArray = await getSourceData(SourceTable);
  return await updateEsIndex(dataArray);
}

exports.go = go;
