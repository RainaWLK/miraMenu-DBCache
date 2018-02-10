const db = require('./dynamodb.js');
const qrcode = require('./qrcode.js');
const s3 = require('./s3.js');
const utils = require('./utils.js');

const SourceTable = "Branches";
const DestTable = "BranchesB2C";

let data_counter = 0;
let db_query_counter = 0;

function getSourceTable(){
  return SourceTable;
}

async function getRestaurant(restaurant_id){
  console.log("db query:"+restaurant_id);
  try {
    let restaurantData = await db.queryById("Restaurants", restaurant_id);
    //db_query_counter++;
    console.log("got "+restaurant_id);
    return restaurantData;
  }
  catch(err){
    console.log(restaurant_id+" not found");
    throw null;
  }
}



async function getSourceData(branchData){
  try {
    let restaurantData = await getRestaurant(branchData.branchControl.restaurant_id);
    return {
      "restaurant": restaurantData,
      "branch": branchData
    }
  }
  catch(err) {
    throw null;
  }
}


async function makeDestData(dataObj){
  let restaurantData = dataObj.restaurant;

  let result = dataObj.branch;
  result.restaurant_id = restaurantData.id;
  result.restaurant_name = restaurantData.name;
  result.branch_name = result.name;
  delete result.name;

  result.availability = (result.availability === false)?false:true;

  //photos
  let has_logo = false;
  let has_main = false;
  for(let i in result.photos){
    if(result.photos[i].role === 'logo') {
      has_logo = true;
    }
    else if(result.photos[i].role === 'main') {
      has_main = true;
    }
  }
  //merge restaurant photo into branch
  for(let i in restaurantData.photos){
    let photoData = restaurantData.photos[i];
    if((has_logo && photoData.role === 'logo') || 
       (has_main && photoData.role === 'main')){
      delete photoData.role;
    }
    result.photos[i] = restaurantData.photos[i];
  }

  //i18n
  if(typeof restaurantData.i18n === 'object'){
    if(result.i18n === undefined){
      result.i18n = {};
    }

    for(let i in restaurantData.i18n){
      result.i18n[i] = restaurantData.i18n[i];
    }
  }

  //qr code
  let idArray = utils.parseID(result.id);
  let path = `restaurants/r${idArray.r}/branches/s${idArray.s}`;
  let url = 'https://mira.menu/'+path;
  let s3path = path+'/qrcode/qrcode.svg';
  let qrcodeStr = await qrcode.createQRCode(url);

  let s3result = await s3.uploadToS3(qrcodeStr, s3path, 'image/svg+xml');
  result.qrcode = 'https://cdn.mira.menu/'+s3result.key;

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

async function outputDestDataArray(dataArray){
  let destDataArray = [];
  for(let i in dataArray){
    let data = dataArray[i];
    let destData = await makeDestData(data);
    destDataArray.push(destData);
  }

  //console.log(destDataArray);
  return await writeDestTable(DestTable, destDataArray);
}

async function outputDestSingleData(dataObj){
  try {
    let destData = await makeDestData(dataObj);

    let result = await db.post(DestTable, destData);
    return result;
  }
  catch(err) {
    throw err;
  }
}

function outputDestData(dataObj){
  if(Array.isArray(dataObj)){
    return outputDestDataArray(dataObj);
  }
  else {
    return outputDestSingleData(dataObj);
  }
}

async function update(inputData, attr){
  let start_time = Date.now();

  try {
    let dataObj = await getSourceData(inputData);

    let result = await outputDestData(dataObj);
    console.log("-------");
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
exports.outputDestData = outputDestData;
exports.getSourceTable = getSourceTable;