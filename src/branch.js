let db = require('./dynamodb.js');
let clone = require('./clone.js');
let qrcode = require('./qrcode.js');
let s3 = require('./s3.js');
let utils = require('./utils.js');

let SourceTable = "Branches";
let DestTable = "BranchesB2C";

let restaurant_cache = {};
let invalidData = [];

let data_counter = 0;
let db_query_counter = 0;
let cache_counter = 0;

async function getRestaurant(restaurant_id){
  let restaurantData = restaurant_cache[restaurant_id];
  console.log(restaurant_id+" checking..");
  data_counter++;
  if(restaurantData === undefined){
    console.log("db query:"+restaurant_id);
    try {
      restaurantData = await db.queryById("Restaurants", restaurant_id);
      db_query_counter++;
      console.log("got "+restaurant_id);
    }
    catch(err){
      console.log(restaurant_id+" not found");
      restaurantData = false;
    }
    restaurant_cache[restaurant_id] = restaurantData;
  }
  else{
    console.log(restaurant_id+" cache goted");
    cache_counter++;
  }
  return restaurantData;
}



async function getSourceData(table){
  let branchDataArray = await db.scan(table);
  let validBranchDataArray = [];
  let promises = [];
  for(let i in branchDataArray){
    let branchData = branchDataArray[i];
    let promise = getRestaurant(branchData.branchControl.restaurant_id).then(restaurantData => {
      if(restaurantData){
        validBranchDataArray.push(branchData);
      }
      else {
        invalidData.push(branchData);
      }
    });
    promises.push(promise);
  }
  await Promise.all(promises);

  let DataArray = validBranchDataArray.map(branchData => {
    let restaurant_id = branchData.branchControl.restaurant_id;
    let restaurantData = restaurant_cache[restaurant_id];

    return {
      "restaurant": restaurantData,
      "branch": branchData
    }
  });
  
  return DataArray;
}


function makeDestData(data){
  let restaurantData = data.restaurant;

  let result = data.branch;
  result.restaurant_id = restaurantData.id;
  result.restaurant_name = restaurantData.name;
  result.branch_name = result.name;
  delete result.name;

  result.availability = (result.availability === false)?false:true;

  //location
  if((result.address === undefined)&&(typeof result.location === 'object')){
    result.address = result.location.address;
  }
  if((result.tel === undefined)&&(typeof result.location === 'object')){
    result.tel = result.location.tel;
  }
  if((result.geolocation === undefined)&&(typeof result.location === 'object')){
    result.geolocation = {};
    result.geolocation.zipcode = result.location.zipcode;
  }
  else if(typeof result.geolocation === 'object'){
    result.geolocation.zipcode = result.geolocation.zipcode?result.geolocation.zipcode:0;
  }
  else {
    result.geolocation = {
      zipcode: 0
    };
  }
  delete result.location;

  if(typeof restaurantData.i18n === 'object'){
    if(result.i18n === undefined){
      result.i18n = {};
    }

    for(let i in restaurantData.i18n){
      result.i18n[i] = restaurantData.i18n[i];
    }
  }


  return result;
}

async function fixTable(data){
  let result = data.branch;

  result.availability = (result.availability === false)?false:true;

  //location
  if((result.address === undefined)&&(typeof result.location === 'object')){
    result.address = result.location.address;
  }
  if((result.tel === undefined)&&(typeof result.location === 'object')){
    result.tel = result.location.tel;
  }
  if((result.geolocation === undefined)&&(typeof result.location === 'object')){
    result.geolocation = {};
    result.geolocation.zipcode = result.location.zipcode;
  }
  else if(typeof result.geolocation === 'object'){
    result.geolocation.zipcode = result.geolocation.zipcode?result.geolocation.zipcode:0;
  }
  else {
    result.geolocation = {
      zipcode: 0
    };
  }
  delete result.location;

  //qr code
  let idArray = utils.parseID(result.id);
  let path = `restaurants/r${idArray.r}/branches/s${idArray.s}`;
  let url = 'https://mira.menu/'+path;
  let s3path = path+'/qrcode/qrcode.svg';
  let qrcodeStr = await qrcode.createQRCode(url);

  let s3result = await s3.uploadToS3(qrcodeStr, s3path, 'image/svg+xml');
  console.log(s3result);
  result.qrcode = 'https://cdn.mira.menu/'+s3result.key;

  return result;
}

async function writeInfoDB(data){
  return await db.postData("Branches", data);
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
    destDataArray.push(destData);
  }

  //console.log(destDataArray);
  await writeDestTable(DestTable, destDataArray);
  console.log("-------");
  console.log("time usage: "+ (Date.now() - start_time));
  
  statistic();

  return destDataArray;
}

function statistic(){
  console.log(Object.keys(restaurant_cache));
  console.log("data counter="+data_counter);
  console.log("db query counter="+db_query_counter);
  console.log("cache counter="+cache_counter);
  console.log("not existed counter="+invalidData.length);
}

exports.go = go;
