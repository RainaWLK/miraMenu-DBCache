let db = require('./dynamodb.js');
let update_branch = require('./update_branch.js');

//let data_counter = 0;
//let db_query_counter = 0;
//let cache_counter = 0;
//let not_exist_counter = 0;

async function getSourceData(inputData){
  var params = {
      TableName: update_branch.SourceTable,
      FilterExpression: "#a1.#a2 = :b",
      ExpressionAttributeNames: {
          "#a1": "branchControl",
          "#a2": "restaurant_id"
      },
      ExpressionAttributeValues: {
           ":b": inputData.id 
      },
      ReturnConsumedCapacity: "TOTAL"
  };
  let branchDataArray = await db.scanDataByFilter(params);
  console.log(branchDataArray);

  let DataArray = branchDataArray.map(branchData => {
    return {
      "restaurant": inputData,
      "branch": branchData
    }
  });
  
  return DataArray;
}

async function update(inputData){
  let start_time = Date.now();

  let dataArray = await getSourceData(inputData);
  console.log(dataArray);

  try {
    let result = await update_branch.outputDestData(dataArray);

    console.log("-------");
    console.log("time usage: "+ (Date.now() - start_time));
    return result;
  }
  catch(err) {
    throw err;
  }
}

function statistic(){
//  console.log("data counter="+data_counter);
//  console.log("db query counter="+db_query_counter);
//  console.log("cache counter="+cache_counter);
//  console.log("not existed counter="+not_exist_counter);
}

exports.update = update;