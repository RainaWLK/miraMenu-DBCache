let db = require('./dynamodb.js');
let clone = require('./clone.js');
let qrcode = require('./qrcode.js');
let s3 = require('./s3.js');
let utils = require('./utils.js');
let I18n = require('./i18n.js');
let es = require('./elasticsearch.js');
let _ = require('lodash');

let SourceTable = "Branches";
let DestTable = "BranchesB2C_dev";
//let DestTable = "Branches";

let restaurant_cache = {};
let invalidData = [];

let data_counter = 0;
let db_query_counter = 0;
let cache_counter = 0;

async function getRestaurant(restaurant_id){
  let restaurantData = restaurant_cache[restaurant_id];
  //console.log(restaurant_id+" checking..");
  data_counter++;
  if(restaurantData === undefined){
    //console.log("db query:"+restaurant_id);
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

  if(typeof restaurantData.i18n === 'object'){
    if(result.i18n === undefined){
      result.i18n = {};
    }

    for(let lang in restaurantData.i18n){
      if(result.i18n[lang] === undefined) {
        result.i18n[lang] = {};
      }
      for(let i in restaurantData.i18n[lang]) {
        result.i18n[lang][i] = restaurantData.i18n[lang][i];
      }
    }
  }

  //translate
  let result_array = [];
  if(_.isEmpty(result.i18n)){
    delete result.i18n;
    result.language = 'en-us';
    result.branch_id = result.id;
    result.id = result.id+'_'+result.language;
    result_array.push(result);
  }
  else {
    for(let lang in result.i18n) {
      if(lang === 'default'){
        continue;
      }
      
      let i18n = new I18n.main(JSON.parse(JSON.stringify(result)));
      let translatedData = i18n.translate(lang);
      translatedData.language = lang;
      translatedData.branch_id = translatedData.id;
      translatedData.id = translatedData.id+'_'+lang;
      result_array.push(translatedData);
    }
  }

  return result_array;
}

async function fixTable(data){
  let result = data.branch;

  result.availability = (result.availability === false)?false:true;

  //qr code
  //let idArray = utils.parseID(result.id);
  //let path = `restaurants/r${idArray.r}/branches/s${idArray.s}`;
  //let url = 'https://mira.menu/'+path;
  //let s3path = path+'/qrcode/qrcode.svg';
  //let qrcodeStr = await qrcode.createQRCode(url);

  //let s3result = await s3.uploadToS3(qrcodeStr, s3path, 'image/svg+xml');
  //console.log(s3result);
  //result.qrcode = 'https://cdn.mira.menu/'+s3result.key;
  
  //lang
  let defaultLang = null;
  let newLang = {};
  for(let key in result.i18n) {
    if(typeof result.i18n[key].default === 'string') {
      defaultLang = result.i18n[key].default;
    }
    
    for(let lang in result.i18n[key].data) {
      if(newLang[lang] === undefined) {
        newLang[lang] = {}
      }
      
      newLang[lang][key] = result.i18n[key].data[lang];
    }
  }
  if(defaultLang) {
    newLang.default = defaultLang;
  }
  result.i18n = newLang;

  return result;
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

async function writeEsIndex(src){
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

  let esArray = src.map(element => makeEsData(element));
  
  return await es.createIndex('branches', 'branch_search', body, esArray);
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
    dataArray.map(elem => {
      console.log(elem.id);
    });
    
    throw err;
  }
}

async function go(){
  let start_time = Date.now();

  let dataArray = await getSourceData(SourceTable);
  
  let destDataArray = [];
  for(let i in dataArray){
    let data = dataArray[i];
    let destData = null;
    if(SourceTable == DestTable){
      //backup first
      await db.createBackup(DestTable);
      destData = await fixTable(data);
    }
    else{
      destData = makeDestData(data);
    }
    destData.forEach(element => {
        destDataArray.push(element);
    });
  }

  console.log("data total: " + dataArray.length);
  console.log("transfered data total: " + destDataArray.length);
  //test
  /*let testExisted = {};
  destDataArray.forEach(element => {
    console.log(element.id);
    console.log(element.restaurant_id);
    console.log(element.branch_id);
    console.log(element.lang)
    
    if(testExisted[element.id] !== undefined) {
      console.log("got dulpicated element!!");
      console.log(element);
    }
    testExisted[element.id] = 1;
    console.log("-----------------------------");
  });*/
  
  //elasticsearch
  await writeEsIndex(destDataArray);
  //output
  await writeDestTable(DestTable, destDataArray);
  console.log("-------");
  console.log("time usage: "+ (Date.now() - start_time));
  
  statistic();

  return destDataArray;
}

function statistic(){
  //console.log(Object.keys(restaurant_cache));
  console.log("data counter="+data_counter);
  console.log("db query counter="+db_query_counter);
  console.log("cache counter="+cache_counter);
  console.log("not existed counter="+invalidData.length);
}

exports.go = go;
