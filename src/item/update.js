const db = require('../common/dynamodb.js');
const utils = require('../common/utils.js');
let I18n = require('../common/i18n.js');
let es = require('../common/elasticsearch.js');
const itemClean = require('./clean.js');
let _ = require('lodash');
let updateMenu = require('../menu/update.js');

const SourceTable = "Menus";
const DestTable = "ItemsB2C";

let data_counter = 0;
let db_query_counter = 0;

async function getBranch(branch_id){
  try {
    let params = {};
    
    let restaurant_query = false;
    if(branch_id.indexOf('s') > 0){
      params = {
        TableName: "BranchesB2C",
        IndexName: "branch_id-index",
        KeyConditionExpression: "#n = :n",
        ExpressionAttributeNames:{
            "#n": "branch_id"
        },
        ExpressionAttributeValues: {
            ":n": branch_id
        }
      };
    }
    else {
      params = {
        TableName: "Restaurants",
        KeyConditionExpression: "#n = :n",
        ExpressionAttributeNames:{
            "#n": "id"
        },
        ExpressionAttributeValues: {
            ":n": branch_id
        }
      };
      restaurant_query = true;
    }

    let branchDataArray = await db.query(params);
    let branchData = branchDataArray[0];
    console.log("got "+branch_id);
    
    if(restaurant_query){
      //fix data
      branchData.restaurant_id = branchData.id;
      branchData.restaurant_name = branchData.name;
      branchData.branch_name = branchData.name;
      delete branchData.name;
    }
    branchData.restaurant_query = restaurant_query;

    return branchData;
  }
  catch(err){
    console.log(branch_id+" not found");
    throw null;
  }

}


async function getSourceData(menuItemData){
  try {
    let branchData = await getBranch(menuItemData.id);
    return {
      "branch": branchData,
      "menus": menuItemData.menus,
      "items": menuItemData.items
    }
  }
  catch(err) {
    throw null;
  }
}


function makeDestData(dataObj){
  let branchData = dataObj.branch;
  let menusData = dataObj.menus;
  let itemsData = dataObj.items;
  
  let result = [];
  for(let i in itemsData) {
    let itemData = itemsData[i];

    itemData.id = i;

    itemData.restaurant_id = branchData.restaurant_id;
    itemData.restaurant_name = branchData.restaurant_name;
    itemData.branch_id = branchData.branch_id;
    itemData.branch_name = branchData.branch_name;

    itemData.availability = (itemData.availability === false)?false:true;
    delete itemData.resources;
    delete itemData.itemControl;

    if(typeof branchData.i18n === 'object'){
      if(itemData.i18n === undefined){
        itemData.i18n = {};
      }
      
      for(let lang in branchData.i18n){
        if(itemData.i18n[lang] === undefined) {
          itemData.i18n[lang] = {};
        }
        for(let i in branchData.i18n[lang]) {
          itemData.i18n[lang][i] = branchData.i18n[lang][i];
        }
      }
    }
    
    //translate
    if(_.isEmpty(itemData.i18n)){
      delete itemData.i18n;
      itemData.language = 'en-us';
      itemData.item_id = itemData.id;
      itemData.id = itemData.id+'_'+itemData.language;
      result.push(itemData);
    }
    else {
      for(let lang in itemData.i18n) {
        if(lang === 'default'){
          continue;
        }
        
        let i18n = new I18n.main(JSON.parse(JSON.stringify(itemData)));
        let translatedData = i18n.translate(lang);
        translatedData.language = lang;
        translatedData.item_id = translatedData.id;
        translatedData.id = translatedData.id+'_'+lang;
        result.push(translatedData);
      }
    }
  }

  return result;
}

async function writeDestTable(table, dataArray){
  var params = {
    RequestItems: {}
  };
  params.RequestItems[table] = [];

  try{
    for(let i in dataArray){
      let data = dataArray[i];
  
      let request = {
        PutRequest: {
          Item: data
        }
      }
      params.RequestItems[table].push(request);
    }
    return await db.batchWrite(params);
  }
  catch(err){
    throw err;
  }
}

function makeEsData(src) {
  let output = _.cloneDeep(src);
  
  output.i18n = JSON.stringify(output.i18n);
  output.photos = JSON.stringify(output.photos);
  delete output.itemControl;
  delete output.resources;
  
  return output;
}

async function updateEsIndex(destDataArray) {
  let esArray = destDataArray.map(element => makeEsData(element));
  //console.log('esArray=');
  //console.log(esArray);
  return await es.updateIndex('items', 'item_search', esArray);
}

async function outputDestData(dataObj){
  let destDataArray = [];
  
  //clean deleted b2c data first
  await itemClean.go(dataObj);

  if(Array.isArray(dataObj)){
    dataObj.forEach(data => {
      let destData = makeDestData(data);
  
      destData.forEach(element => {
          destDataArray.push(element);
      });      
    });

  }
  else {
    destDataArray = makeDestData(dataObj);
  }
  //test
  let testExisted = {};
  destDataArray.forEach(element => {
    if(testExisted[element.id] !== undefined) {
      console.log("got dulpicated element!!");
      console.log(element);
    }
    testExisted[element.id] = 1;
  });
  if(_.isEmpty(destDataArray)) {
    console.log('dest data is empty, skip');
    return;
  }
  //elasticsearch
  //console.log('destDataArray=');
  //console.log(destDataArray);
  await updateEsIndex(destDataArray);

  //db
  return await writeDestTable(DestTable, destDataArray);  
}

async function update(inputData){
  let start_time = Date.now();

  try {
    let dataObj;
    if(Array.isArray(inputData)) {
      dataObj = [];
      for(let i in inputData) {
        try {
          let singleDataObj = await getSourceData(inputData[i]);
          dataObj.push(singleDataObj);
        }
        catch(err){
          //continue
        }
      }
    }
    else {
      dataObj = await getSourceData(inputData);
    }
    let result = await outputDestData(dataObj);
    
    //menu
    result = await updateMenu.outputDestData(dataObj);
    console.log("-------");
    console.log(`count: ${dataObj.length}`);
    console.log("time usage: "+ (Date.now() - start_time));
    return result;
  }
  catch(err) {
    throw err;
  }
}

async function deleteData(key) {
  console.log('remove '+key);
  
  return;
}

function statistic(){
//  console.log(Object.keys(restaurant_cache));
//  console.log("data counter="+data_counter);
//  console.log("db query counter="+db_query_counter);
}

exports.update = update;
exports.deleteData = deleteData;
exports.SourceTable = SourceTable;
exports.outputDestData = outputDestData;
exports.makeEsData = makeEsData;

//for test
exports.getSourceData = getSourceData;
exports.makeDestData = makeDestData;