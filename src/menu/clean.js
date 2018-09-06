const db = require('../common/dynamodb.js');
const utils = require('../common/utils.js');
let I18n = require('../common/i18n.js');
let es = require('../common/elasticsearch.js');
let _ = require('lodash');

const DestTable = "MenusB2C";

async function getIdDelete(newData, id_delete) {
  try {
    let branch_id = newData.branch.branch_id;
    let newMenusData = newData.menus;
    let sourceDataArray = await db.queryByKey('MenusB2C', 'branch_id-index', 'branch_id', branch_id);
  
    //search non-existed
    sourceDataArray.forEach(menuData => {
      let menu_id = menuData.menu_id;
      if(newMenusData[menu_id] === undefined) {
        console.log(menuData.id+' not existed');
        id_delete.push(menuData.id);
      }
    });
    return;
  }
  catch(err) {
    if(err.statusCode === 404) {
      console.log('no data need to be clean, skip');
      return;
    }
    console.error(err);
    throw err;
  }

}

async function clean(id_delete) {
  try {
    if(id_delete.length == 0) {
      return;
    }
    let params = {
      RequestItems: {}
    };
    params.RequestItems[DestTable] = [];
    
    for(let i in id_delete) {
      let request = {
        DeleteRequest: {
          Key: { id: id_delete[i] }
        }
      }
      params.RequestItems[DestTable].push(request);
      await es.deleteIndex('menus', 'menu_search', id_delete[i]);
    }
    //console.log(JSON.stringify(params));
    return await db.batchWrite(params);
  }
  catch(err) {
    console.error(err);
    throw err;
  }
}


async function go(inputData) {
  let id_delete = [];
  try {
    if(Array.isArray(inputData)) {
      for(let i in inputData) {
        await getIdDelete(inputData[i], id_delete);
      }
    } else {
      await getIdDelete(inputData, id_delete);
    }
    await clean(id_delete);
  }
  catch(err) {
    throw err;
  }
}

exports.go = go;
exports.clean = clean;

//for test
exports.getIdDelete = getIdDelete;