let AWS = require('aws-sdk');
let _ = require('lodash');

AWS.config.update({
    region: "us-west-2"
});

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

async function queryDataById(tableName, id){
    var params = {
        TableName : tableName,
        KeyConditionExpression: "#id = :id",
        ExpressionAttributeNames:{
            "#id": "id"
        },
        ExpressionAttributeValues: {
            ":id":id
        },
        ReturnConsumedCapacity: "TOTAL"
    };

    try {
        let dataArray = await queryData(params);
        //debug
        if(dataArray.length > 1){
            console.log('!!!! queryDataById issue !!!!!');
        }
        return dataArray[0];
    }
    catch(err) {
        throw err;
    }

}

async function queryByKey(tableName, indexName, keyName, key, filterParams){
  var params = {
    TableName : tableName,
    KeyConditionExpression: "#key = :key",
    ExpressionAttributeNames:{
        "#key": keyName
    },
    ExpressionAttributeValues: {
        ":key":key
    },
    ReturnConsumedCapacity: "TOTAL"
  };

  if(indexName !== null) {
    params.IndexName = indexName;
  }
  if(typeof filterParams === 'object') {
    for(let i in filterParams.ExpressionAttributeNames) {
      params.ExpressionAttributeNames[i] = filterParams.ExpressionAttributeNames[i];
    }
    for(let i in filterParams.ExpressionAttributeValues) {
      params.ExpressionAttributeValues[i] = filterParams.ExpressionAttributeValues[i];
    }
    params.FilterExpression = filterParams.FilterExpression;
  }

  try {
    let dataArray = await queryData(params);
    if(dataArray.length == 0) {
      let err = new Error("not found");
      err.statusCode = 404;
      throw err;
    }

    return dataArray;
  }
  catch(err) {
      throw err;
  }

}

async function queryData(params) {
    try {
        let result = await docClient.query(params).promise();
        //console.log(result);
        //console.log("Consumed Capacity:");
        //console.log(result.ConsumedCapacity);
        if(result.Items.length == 0) {
            let err = new Error("not found");
            err.statusCode = 404;
            throw err;
        }
        return result.Items;
    }
    catch(err){
      //console.log(err);
      throw err;
    }
}

async function scanDataByFilter(params){
    try {
        let data = await docClient.scan(params).promise();
        console.log("Consumed Capacity:");
        console.log(data.ConsumedCapacity);
        return data.Items;
    }
    catch(err){
        console.log(err);
        throw err;
    }
}

async function scanData(tableName){
    try {
        let data = await docClient.scan({ TableName: tableName }).promise();
        return data.Items;
    }
    catch(err){
        console.log(err);
        throw err;
    }
}

function fixEmptyValue(data){
  let outputData = {};
  for(let i in data){

    if(data[i] === ""){
      continue;
    }
    else if(Array.isArray(data[i])){
      data[i] = data[i].filter(elem => {
        return elem !== "";
      })
      .map(elem => {
        if(typeof elem === 'object'){
          elem = fixEmptyValue(elem);
        }
        return elem;
      });
    }
    else if(typeof data[i] === 'object'){
      data[i] = fixEmptyValue(data[i]);
    }

    outputData[i] = data[i];
  }

  return outputData;
}

function postData(tableName, data){
  //check
  let inputData = fixEmptyValue(data);

  var params = {
      TableName: tableName,
      Item: inputData
  };
  //console.log("==postData==");
  //console.log(params);
  return new Promise((resolve, reject) => {

      docClient.put(params).promise().then(result => {
          console.log("Added item:", JSON.stringify(result, null, 2));
          resolve(result);
      }).catch(err => {
          console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
          reject(err);
      });

  });
    
}

function putData(tableName, data){
    //check
    let inputData = fixEmptyValue(data);    

    let updateAttr = {};
    let updateExp = "set ";
    let replacedName = {};
    let num = 0;
    for(let i in inputData){
        if(i == 'id')
            continue;
        updateExp += "#b" + num + "=" + ":a" + num +",";
        replacedName["#b"+num] = i;
        updateAttr[":a"+num] = inputData[i];
        num++;
    }
    updateExp = updateExp.slice(0, updateExp.length-1); //remove last char

    var params = {
        TableName: tableName,
        Key:{
            "id": inputData.id
        },
        UpdateExpression: updateExp,
        ExpressionAttributeNames: replacedName,
        ExpressionAttributeValues: updateAttr,
        ReturnValues:"UPDATED_NEW"
    };

    return new Promise((resolve, reject) => {

        docClient.update(params).promise().then(result => {
            console.log("UpdateItem succeeded:", JSON.stringify(inputData, null, 2));
             let outputData = result.Attributes;
             outputData.id = inputData.id;
            resolve(outputData);
        }).catch(err => {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            reject(err);
        });

    });
    
}

function deleteData(tableName, data){
    var params = {
        TableName:tableName,
        Key:{
            "id": data.id
        }
        //ConditionExpression:"info.rating <= :val",
        //ExpressionAttributeValues: {
        //    ":val": 5.0
        //}
    };

    return new Promise((resolve, reject) => {
        docClient.delete(params).promise().then(result => {
            console.log("DeleteItem succeeded:", JSON.stringify(result, null, 2));
            resolve(result);
        }).catch(err => {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
            reject(err);
        });

    });
    
}

function batchGet(params){
  return new Promise((resolve, reject) => {
    //params = fixEmptyValue(params);

    docClient.batchGet(params).promise().then(result => {
      console.log("Batch get succeeded:", JSON.stringify(result, null, 2));
      resolve(result);
    }).catch(err => {
      console.error("Batch get fail. Error JSON:", JSON.stringify(err, null, 2));
      reject(err);
    });
  });
}

async function batchWrite(inputParams){
  let runBatchWrite = async (params) => {
    try {
      let result = await docClient.batchWrite(params).promise();
      console.log("Batch write succeeded:", JSON.stringify(result, null, 2));
      return result;
    }
    catch(err) {
      console.error("Batch write fail. Error JSON:", JSON.stringify(err, null, 2));
      throw err;
    }
  };
  
  
  try {
    inputParams = fixEmptyValue(inputParams);
    
    let outputParams = {
      RequestItems: {}
    };
    let count = 0;
    let result = null;
    for(let table in inputParams.RequestItems) {
      outputParams.RequestItems[table] = [];
      
      for(let i in inputParams.RequestItems[table]) {
        let data = inputParams.RequestItems[table][i];
        outputParams.RequestItems[table].push(data);
        count++;
        //batchWrite limit 25
        if(count >= 25){
          result = await runBatchWrite(outputParams);
          outputParams.RequestItems[table] = [];
          count = 0;
        }
      }
      if(outputParams.RequestItems[table].length > 0) {
        result = await runBatchWrite(outputParams);
      }
      delete outputParams.RequestItems[table];
      count = 0;
    }
    return result;
  }
  catch(err) {
    throw err;
  }
}

async function createBackup(table){
  let today = new Date();
  let timeStr = today.toISOString().replace(/\:|\./g,"");
  let params = {
    BackupName: `${table}_${timeStr}`, /* required */
    TableName: table /* required */
  };
  //console.log(params);

  try{
    console.log("Create backup from "+table+" ....");
    let data = await dynamodb.createBackup(params).promise();
    console.log(data);
    return data;
  }
  catch(err){
    console.error(err, err.stack);
    throw err;
  }
  
}

async function purgeBackup(table) {
  var params = {
    TableName: table,
  };
  let data = await dynamodb.listBackups(params).promise();
  let count = 0;
  for(let i in data.BackupSummaries) {
    let backup = data.BackupSummaries[i];
    let params = {
      BackupArn: backup.BackupArn
    }
    await dynamodb.deleteBackup(params).promise();
    count++;
    if(count >= 10){  //You can call DeleteBackup at a maximum rate of 10 times per second.
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
      count = 0;
    }
  }
  return;
}

async function unittest(){
  let table = "photo_tmp";
  const dateTime = Date.now();
  const timestamp = Math.floor(dateTime);

  let runTest = async (testCase) => {
    let output = await postData(table, testCase);
    console.log(output);
    let queryoutput = await queryDataById(table, testCase.id);
    console.log(queryoutput);
    testCase["newtest"] = ">///<";
    let putoutput = await putData(table, testCase);
    console.log(putoutput);
    queryoutput = await queryDataById(table, testCase.id);
    console.log(queryoutput);
    let deleteoutput = await deleteData(table, testCase);
    console.log(deleteoutput); 
  }
  
  try{
    let testData = {
      "id": "r12345678-0s897661-1i"+timestamp,
      "test1": "",
      "test2": "1",
      "test3": 0,
      "test4": {
        "test4-1": "1",
        "test4-2": "",
        "test4-3": 1
      },
      "test5": ["0", "", 0, "1", 1]
    }
    await runTest(testData);
  }
  catch(err){
    console.log(err);
  }

}

exports.queryById = queryDataById;
exports.queryByKey = queryByKey;
exports.query = queryData;
exports.scan = scanData;
exports.post = postData;
exports.put = putData;
exports.delete = deleteData;
exports.batchGet = batchGet;
exports.batchWrite = batchWrite;
exports.createBackup = createBackup;

exports.scanDataByFilter = scanDataByFilter;

//exports.fixEmptyValue = fixEmptyValue;

exports.unittest = unittest;