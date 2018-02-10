let db = require('./dynamodb.js');
let clone = require('./clone.js');
let utils = require('./utils.js');

let SourceTable = "Menus";
let DestTable = "ItemsB2C";

let parent_cache = {};
let invalidData = [];

let data_counter = 0;
let db_query_counter = 0;
let cache_counter = 0;

async function getBranch(branch_id){
  let Branch_Table = "BranchesB2C";
  let restaurant_query = false;
  if(branch_id.indexOf('s') < 0){
    Branch_Table = "Restaurants";
    restaurant_query = true;
  }

  let branchData = parent_cache[branch_id];
  console.log(branch_id+" checking..");
  data_counter++;
  if(branchData === undefined){
    console.log("db query:"+branch_id);
    try {
      branchData = await db.queryById(Branch_Table, branch_id);
      db_query_counter++;
      console.log("got "+branch_id);
    }
    catch(err){
      console.log(branch_id+" not found");
      branchData = false;
    }
    if(restaurant_query){
      //fix data
      branchData.restaurant_id = branchData.id;
      branchData.restaurant_name = branchData.name;
      branchData.branch_name = branchData.name;
      delete branchData.name;
    }
    parent_cache[branch_id] = branchData;
  }
  else{
    console.log(branch_id+" cache goted");
    cache_counter++;
  }
  return branchData;
}



async function getSourceData(table){
  let menusDataArray = await db.scan(table);
  let validMenusDataArray = [];
  let promises = [];
  for(let i in menusDataArray){
    let menuItemData = menusDataArray[i];
    let promise = getBranch(menuItemData.id).then(branchData => {
      if(branchData){
        validMenusDataArray.push(menuItemData);
      }
      else {
        invalidData.push(menuItemData);
      }
    });
    promises.push(promise);
  }
  await Promise.all(promises);

  let DataArray = validMenusDataArray.map(menuItemData => {
    let branchData = parent_cache[menuItemData.id];

    return {
      "branch": branchData,
      "menus": menuItemData.menus,
      "items": menuItemData.items
    }
  });
  
  return DataArray;
}


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
  
      for(let i in branchData.i18n){
        itemData.i18n[i] = branchData.i18n[i];
      }
    }
    result.push(itemData);
  }

  return result;
}

async function fixTable(data){
  let result = data.branch;

  result.availability = (result.availability === false)?false:true;

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
    
        console.log(params);
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

async function go(){
  let start_time = Date.now();

  //backup first
  //await clone.go("BranchesBak", SourceTable);
  
  let dataArray = await getSourceData(SourceTable);
  //console.log(dataArray);

  let destDataArray = [];
  for(let i in dataArray){
    let data = dataArray[i];
    let destData = null;
    if(SourceTable == DestTable){
      destData = await fixTable(data);
    }
    else{
      destData = makeDestData(data);
    }
    destDataArray = destDataArray.concat(destData);
  }

  console.log(destDataArray);
  await writeDestTable(DestTable, destDataArray);
  console.log("-------");
  console.log("time usage: "+ (Date.now() - start_time));
  
  statistic();

  return destDataArray;
}

function statistic(){
  console.log(Object.keys(parent_cache));
  console.log("data counter="+data_counter);
  console.log("db query counter="+db_query_counter);
  console.log("cache counter="+cache_counter);
  console.log("not existed counter="+invalidData.length);
}

exports.go = go;
