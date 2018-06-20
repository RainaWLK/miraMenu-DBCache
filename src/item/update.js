const db = require('../common/dynamodb.js');
const utils = require('../common/utils.js');
let I18n = require('../common/i18n.js');
let es = require('../common/elasticsearch.js');
let _ = require('lodash');

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
    
    console.log("db query:"+branch_id);
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
    return await db.batchWrite(params);
  }
  catch(err){
    throw err;
  }
}

function makeEsData(src) {
  let output = _.cloneDeep(src);
  
  delete output.i18n;
  delete output.photos;
  delete output.itemControl;
  delete output.resources;
  
  return output;
}

async function updateEsIndex(destDataArray) {
  let esArray = destDataArray.map(element => makeEsData(element));
  return await es.updateIndex('items', 'item_search', esArray);
}

async function outputDestData(dataObj){
  let destDataArray = [];

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
    console.log(element.id);
    //console.log(element.branch_id);
    //console.log(element.item_id);
    //console.log(element.language)
    
    if(testExisted[element.id] !== undefined) {
      console.log("got dulpicated element!!");
      console.log(element);
    }
    testExisted[element.id] = 1;
    console.log("-----------------------------");
  });
  //elasticsearch
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
    console.log("-------");
    console.log(`count: ${dataObj.length}`);
    console.log("time usage: "+ (Date.now() - start_time));
    return result;
  }
  catch(err) {
    throw err;
  }
}

function statistic(){
//  console.log(Object.keys(restaurant_cache));
//  console.log("data counter="+data_counter);
//  console.log("db query counter="+db_query_counter);
}

exports.update = update;
exports.SourceTable = SourceTable;
exports.outputDestData = outputDestData;