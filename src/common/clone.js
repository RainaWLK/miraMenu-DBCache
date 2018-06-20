let db = require('./dynamodb.js');

async function writeTable(table, dataArray){
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


async function go(destTable, sourceTable){
  let start_time = Date.now();

  //backup first
  await db.createBackup(destTable);
  
  let dataArray = await db.scan(sourceTable);
  //console.log(dataArray);

  let result = await writeTable(destTable, dataArray);
  console.log("-------");
  console.log(result);
  console.log("time usage: "+ (Date.now() - start_time));
  //statistic();

  return result;
}

function statistic(){

}

exports.go = go;