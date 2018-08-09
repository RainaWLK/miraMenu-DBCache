let db = require('../common/dynamodb.js');
let utils = require('../common/utils.js');
let updateItem = require("./update.js");

let SourceTable = "Menus";
let DestTable = "MenusB2C";
//let DestTable = "Menus";

let parent_cache = {};
let invalidData = [];

let data_counter = 0;
let db_query_counter = 0;
let cache_counter = 0;

async function getTargetData(table){
  let dataArray = await db.scan(table);

  //for debug
  //let dataArray = await db.queryById(table, 'r1528125059703s1528125119706');

  return dataArray;
}

async function getBranch(branch_id){
  try {
    let params = {};
    
    let restaurant_query = false;
    if(branch_id.indexOf('s') > 0){
      params = {
        TableName: "Branches",
        //IndexName: "branch_id-index",
        KeyConditionExpression: "#n = :n",
        ExpressionAttributeNames:{
            "#n": "id"
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

function fixTable_menus(data) {
  let result = data;
  
  let section_id = 0;

  if(Array.isArray(result.sections)) {
    result.sections = result.sections.map(section => {
      section.id = section_id++;
      return section;
    });
  }

  return result;
}

function fixTable_items(data) {
  let result = data;

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
}

async function go() {
  let start_time = Date.now();

  let targetDataArray = await getTargetData(SourceTable);
  
  if(SourceTable != DestTable){
    return await updateItem.update(targetDataArray);
  }
  else {
    //backup first
    //await db.createBackup(DestTable);
    
    //source data
    let dataArray = [];
    if(Array.isArray(targetDataArray)) {
      for(let i in targetDataArray) {
        try {
          dataArray.push(await getSourceData(targetDataArray[i]));
        }
        catch(err) {
          invalidData.push(targetDataArray[i]);
        }
      }
    }
    else { //for debug
      dataArray.push(await getSourceData(targetDataArray));
    }
  
    let destDataArray = [];
    for(let i in dataArray){
      let data = dataArray[i];
      let destData = null;
      
      destData = fixTable(data);
      destDataArray = destDataArray.concat(destData);
    }
  
    console.log(destDataArray);
    await writeDestTable(DestTable, destDataArray);
    console.log("-------");
    console.log("time usage: "+ (Date.now() - start_time));
    
    statistic();
  
    return destDataArray;
  }
}

function statistic(){
  //console.log(Object.keys(parent_cache));
  console.log("data counter="+data_counter);
  console.log("db query counter="+db_query_counter);
  console.log("cache counter="+cache_counter);
  console.log("not existed counter="+invalidData.length);
}

exports.go = go;
