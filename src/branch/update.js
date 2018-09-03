const db = require('../common/dynamodb.js');
const qrcode = require('../common/qrcode.js');
const s3 = require('../common/s3.js');
const utils = require('../common/utils.js');
let I18n = require('../common/i18n.js');
let es = require('../common/elasticsearch.js');
let _ = require('lodash');

const SourceTable = "Branches";
const DestTable = "BranchesB2C";

let data_counter = 0;
let db_query_counter = 0;

let id_delete = [];

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


function makeDestData(dataObj){
  let restaurantData = dataObj.restaurant;

  let result = dataObj.branch;
  result.restaurant_id = restaurantData.id;
  result.restaurant_name = restaurantData.name;
  result.branch_name = result.name;
  delete result.name;

  result.availability = (result.availability === false)?false:true;

  //i18n
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

  //merge restaurant photo into branch
  /*let has_logo = false;
  let has_main = false;
  for(let i in result.photos){
    if(result.photos[i].role === 'logo') {
      has_logo = true;
    }
    else if(result.photos[i].role === 'main') {
      has_main = true;
    }
  }
  for(let i in restaurantData.photos){
    let photoData = restaurantData.photos[i];
    if((has_logo && photoData.role === 'logo') || 
       (has_main && photoData.role === 'main')){
      delete photoData.role;
    }
    result.photos[i] = restaurantData.photos[i];
  }*/
  //merge restaurant photo into branch if no photo with it
  if(_.isEmpty(result.photos)){
    let id = "";
    let photoData = {};
    //find logo or main
    for(let i in restaurantData.photos){
      if(restaurantData.photos[i].role === 'logo'){
        id = i;
        photoData = restaurantData.photos[i];
        break;
      }
      else if(restaurantData.photos[i].role === 'main'){
        id = i;
        photoData = restaurantData.photos[i];
      }
    }
    //if still empty, get any photo
    if(id === ""){
      for(let i in restaurantData.photos){
        id = i;
        photoData = restaurantData.photos[i];
        break;
      }
    }
    
    if(id !== ""){
      result.photos = {};
      result.photos[id] = photoData;
    }
  }

  //qr code
  /*let idArray = utils.parseID(result.id);
  let path = `restaurants/r${idArray.r}/branches/s${idArray.s}`;
  let url = 'https://mira.menu/'+path;
  let s3path = path+'/qrcode/qrcode.svg';
  let qrcodeStr = await qrcode.createQRCode(url);

  let s3result = await s3.uploadToS3(qrcodeStr, s3path, 'image/svg+xml');
  result.qrcode = 'https://cdn.mira.menu/'+s3result.key;*/

  //translate
  let result_array = [];
  if(_.isEmpty(result.i18n)){
    delete result.i18n;
    result.language = 'en-us';
    result.branch_id = result.id;
    result.id = result.id+'_'+result.language;
    result_array.push(result);
    if(result.publish === false) {
      id_delete.push(result.id);
    } else {
      result_array.push(result);
    }
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
      if(result.publish === false) {
        id_delete.push(translatedData.id);
      } else {
        result_array.push(translatedData);
      }
    }
  }

  return result_array;
}

async function writeDestTable(table, dataArray){
  console.log("start write...");
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
    //clean
    for(let i in id_delete) {
      let request = {
        DeleteRequest: {
          Key: { id: id_delete[i] }
        }
      }
      params.RequestItems[table].push(request);
      //es
      await es.deleteIndex('branches', 'branch_search', id_delete[i]);
    }
    id_delete = [];

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
  //console.log(destDataArray);
  //test
  /*let testExisted = {};
  destDataArray.forEach(element => {
    console.log(element.id);
    console.log(element.restaurant_id);
    console.log(element.branch_id);
    console.log(element.language)
    
    if(testExisted[element.id] !== undefined) {
      console.log("got dulpicated element!!");
      console.log(element);
    }
    testExisted[element.id] = 1;
    console.log("-----------------------------");
  });*/
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
    console.log("time usage: "+ (Date.now() - start_time));
    return result;
  }
  catch(err) {
    throw err;
  }
}

async function deleteData(key) {
  try {
    let table = 'BranchesB2C';
    console.log('remove '+key);
    let dataArray = await db.queryByKey(table, 'branch_id-index', 'branch_id', key);
    console.log(dataArray);
    //delete
    var params = {
      RequestItems: {}
    };
    params.RequestItems[table] = [];
  
    try{
      for(let i in dataArray) {
        let request = {
          DeleteRequest: {
            Key: { id: dataArray[i].id }
          }
        }
        params.RequestItems[table].push(request);
        //es
        await es.deleteIndex('branches', 'branch_search', dataArray[i].id);
      }
      console.log(params.RequestItems[table]);
      return await db.batchWrite(params);
    }
    catch(err){
      throw err;
    }
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
exports.deleteData = deleteData;
exports.SourceTable = SourceTable;
exports.outputDestData = outputDestData;