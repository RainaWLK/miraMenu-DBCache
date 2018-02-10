let db = require('./dynamodb.js');
let clone = require('./clone.js');

let SourceTable = "Restaurants";
let DestTable = "RestaurantsB2C";
//let data_counter = 0;
//let db_query_counter = 0;
//let cache_counter = 0;
//let not_exist_counter = 0;

async function getSourceData(table){
  let sourceDataArray = await db.scan(table);

  /*let DataArray = sourceDataArray.map(sourceData => {
    let restaurant_id = branchData.branchControl.restaurant_id;
    let restaurantData = restaurant_cache[restaurant_id];

    return {
      "restaurant": restaurantData,
      "branch": branchData
    }
  });*/
  
  return sourceDataArray;
}

function makeDestData(data){
  let result = data;

  //location
  if((result.address === undefined)&&(typeof result.location === 'object')){
    result.address = result.location.address;
  }
  if((result.tel === undefined)&&(typeof result.location === 'object')){
    result.tel = result.location.tel;
  }
  if((result.geolocation === undefined)&&(typeof result.location === 'object')){
    result.geolocation = {};
    result.geolocation.zipcode = result.location.zipcode?result.location.zipcode:"0";
  }
  else if(typeof result.geolocation === 'object'){
    result.geolocation.zipcode = result.geolocation.zipcode?result.geolocation.zipcode:"0";
  }
  else {
    result.geolocation.zipcode = "0";
  }
  delete result.location;

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
    return await db.batchWrite(params);
  }
  catch(err){
    throw err;
  }
}

async function go(){
  let start_time = Date.now();

  //backup first
  await clone.go("RestaurantsBak", SourceTable);
  
  let dataArray = await getSourceData("Restaurants");
  //console.log(dataArray);

  let destData = dataArray.map(data => {
    if(SourceTable == DestTable){
      return fixTable(data)
    }
    else{
      return makeDestData(data);
    }
  });

  console.log(destData);
  await writeDestTable(DestTable, destData);
  console.log("-------");
  console.log("time usage: "+ (Date.now() - start_time));

  statistic();

  return B2CData;
}

function statistic(){
//  console.log("data counter="+data_counter);
//  console.log("db query counter="+db_query_counter);
//  console.log("cache counter="+cache_counter);
//  console.log("not existed counter="+not_exist_counter);
}

exports.go = go;
