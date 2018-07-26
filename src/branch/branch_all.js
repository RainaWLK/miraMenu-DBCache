let db = require('../common/dynamodb.js');
let clone = require('../common/clone.js');
let updateBranch = require("./update.js");
//let qrcode = require('../common/qrcode.js');
let s3 = require('../common/s3.js');
let utils = require('../common/utils.js');
let I18n = require('../common/i18n.js');
let _ = require('lodash');

let SourceTable = "Branches";
let DestTable = "BranchesB2C";
//let DestTable = "Branches";

let restaurant_cache = {};
let invalidData = [];

let data_counter = 0;
let db_query_counter = 0;
let cache_counter = 0;


async function getTargetData(table){
  let dataArray = await db.scan(table);
  
  //for debug
  //let dataArray = await db.queryById(table, 'r1528786306942s1529481171083');
  
  return dataArray;
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

/*
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
*/

async function go(){
  let start_time = Date.now();

  let dataArray = await getTargetData(SourceTable);
  return await updateBranch.update(dataArray);
  /*
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
  
  //elasticsearch
  await writeEsIndex(destDataArray);
  //output
  await writeDestTable(DestTable, destDataArray);
  console.log("-------");
  console.log("time usage: "+ (Date.now() - start_time));
  
  statistic();

  return destDataArray;*/
}

/*
function statistic(){
  //console.log(Object.keys(restaurant_cache));
  console.log("data counter="+data_counter);
  console.log("db query counter="+db_query_counter);
  console.log("cache counter="+cache_counter);
  console.log("not existed counter="+invalidData.length);
}*/

exports.go = go;
