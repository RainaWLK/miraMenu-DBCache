let db = require('./dynamodb.js');
let utils = require('./utils.js');
let updateItem = require("./update_item.js");
let es = require('./elasticsearch.js');

let SourceTable = "Menus";
let DestTable = "ItemsB2C";
//let DestTable = "Menus";

let parent_cache = {};
let invalidData = [];

let data_counter = 0;
let db_query_counter = 0;
let cache_counter = 0;

async function getSourceData(table){
  let menusDataArray = await db.scan(table);
  
  return menusDataArray;
}

async function createEsIndex(){
  let chinese_analyzer = {
    type: 'text',
    analyzer: 'ik_smart',
    search_analyzer: 'ik_smart'
  };
  
  let body = {
    properties: {
      restaurant_name: chinese_analyzer,
      branch_name: chinese_analyzer,
      name: chinese_analyzer,
      category: chinese_analyzer,
      desc: chinese_analyzer
    }
  };

  return await es.initIndex('items', 'item_search', body);
}

/*
function makeDestData(dataSet){
  let branchData = dataSet.branch;
  let menusData = dataSet.menus;
  let itemsData = dataSet.items;

  let result = [];
  for(let i in itemsData) {
    let itemData = itemsData[i];

    itemData.id = i;

    itemData.restaurant_id = branchData.restaurant_id;
    itemData.restaurant_name = branchData.restaurant_name;
    itemData.branch_id = branchData.id;
    itemData.branch_name = branchData.branch_name;

    itemData.availability = (itemData.availability === false)?false:true;

    if(typeof branchData.i18n === 'object'){
      if(itemData.i18n === undefined){
        itemData.i18n = {};
      }
  
      //for(let i in branchData.i18n){
      //  itemData.i18n[i] = branchData.i18n[i];
      //}
      
      for(let lang in branchData.i18n){
        if(itemData.i18n[lang] === undefined) {
          itemData.i18n[lang] = {};
        }
        for(let i in branchData.i18n[lang]) {
          itemData.i18n[lang][i] = branchData.i18n[lang][i];
        }
      }
    }
    result.push(itemData);
  }

  return result;
}

function fixLang(orgI18n){
  let defaultLang = '';
  let newLang = {};
  for(let key in orgI18n) {
    if(typeof orgI18n[key].default === 'string') {
      defaultLang = orgI18n[key].default;
    }

    for(let lang in orgI18n[key].data) {
      if(newLang[lang] === undefined) {
        newLang[lang] = {}
      }
      
      newLang[lang][key] = orgI18n[key].data[lang];
    }
  }
  if(defaultLang) {
    newLang.default = defaultLang;
  }
  return newLang;
}

function fixTable_menus(data) {
  let result = data;

  //lang
  result.i18n = fixLang(result.i18n);
  
  return result;
}

function fixTable_items(data) {
  let result = data;
  result.availability = (result.availability === false)?false:true;
  
  //lang
  result.i18n = fixLang(result.i18n);
  
  return result;
}

function fixTable(data){
  let result = {
    id: data.branch.id,
    menus: {},
    items: {}
  };
  for(let id in data.menus) {
    result.menus[id] = fixTable_menus(data.menus[id]);
  }
  for(let id in data.items) {
    result.items[id] = fixTable_items(data.items[id]);
  }
  //console.log(result);
  
  return result;
}

async function writeDestTable(table, dataArray){
  console.log("start write...");
  var params = {
    RequestItems: {}
  }; 
  params.RequestItems[table] = [];

  try{
    let count = 0;
    for(let i in dataArray){
      let data = dataArray[i];
  
      let request = {
        PutRequest: {
          Item: data
        }
      }
      params.RequestItems[table].push(request);
      count++;
  
      //batchWrite limit 25
      if(count >= 25){
        await db.batchWrite(params);
        params.RequestItems[table] = [];
        count = 0;
      }
    }
    await db.batchWrite(params);

    //delete
    if(SourceTable == DestTable){
      for(let i in invalidData){
        let data = invalidData[i];
    
        let request = {
          DeleteRequest: {
            Key: {
              "id": data.id
            }
          }
        }
        params.RequestItems[table].push(request);
        count++;
    
        //console.log(params);
        //batchWrite limit 25
        if(count >= 25){
          await db.batchWrite(params);
          params.RequestItems[table] = [];
          count = 0;
        }
      }
      await db.batchWrite(params);
    }
    return;
  }
  catch(err){
    throw err;
  }
}*/

async function go() {
  let start_time = Date.now();

  //init elasticsearch
  createEsIndex();

  //transfer db
  let dataArray = await getSourceData(SourceTable);
  return await updateItem.update(dataArray);
/*
  //backup first
  await db.createBackup(DestTable);
  
  //let dataArray = await getSourceData(SourceTable);
  //console.log(dataArray);

  let destDataArray = [];
  for(let i in dataArray){
    let data = dataArray[i];
    let destData = null;
    if(SourceTable == DestTable){
      destData = fixTable(data);
    }
    else{
      destData = makeDestData(data);
    }
    destDataArray = destDataArray.concat(destData);
  }

  //console.log(destDataArray);
  await writeDestTable(DestTable, destDataArray);
  console.log("-------");
  console.log("time usage: "+ (Date.now() - start_time));
  
  statistic();

  return destDataArray;*/
}

function statistic(){
  //console.log(Object.keys(parent_cache));
  console.log("data counter="+data_counter);
  console.log("db query counter="+db_query_counter);
  console.log("cache counter="+cache_counter);
  console.log("not existed counter="+invalidData.length);
}

exports.go = go;
