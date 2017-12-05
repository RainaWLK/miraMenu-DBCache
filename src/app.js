let db = require('./dynamodb.js');

let restaurant_cache = {};

async function getRestaurant(restaurant_id){
  let restaurantData = restaurant_cache[restaurant_id];

  if(restaurantData === undefined){
    try {
      restaurantData = await db.queryById("Restaurants", restaurant_id);
      //console.log("got "+restaurant_id);
    }
    catch(err){
      //console.log(restaurant_id+" not found");
      restaurantData = false;
    }
    restaurant_cache[restaurant_id] = restaurantData;
  }
  return restaurantData;
}



async function getBranches(){
  let branchDataArray = await db.scan("Branches");
  let validBranchDataArray = [];
  for(let i in branchDataArray){
    let branchData = branchDataArray[i];
    let restaurantData = await getRestaurant(branchData.branchControl.restaurant_id);
    if(restaurantData){
      validBranchDataArray.push(branchData);
    }
  }

  let DataArray = validBranchDataArray.map(branchData => {
    let restaurant_id = branchData.branchControl.restaurant_id;
    let restaurantData = restaurant_cache.restaurant_id;

    return {
      "restaurant": restaurantData,
      "branch": branchData
    }
  });
  
  return DataArray;
}

function makeBranchB2C(dataArray){
  //dataArray.map()

}


async function main(){
  /*var params = {
    TableName: "Branches",
    //ProjectionExpression: "#yr, title, info.rating",
    FilterExpression: "#a1.#a2 = :b",
    ExpressionAttributeNames: {
        "#a1": "branchControl",
        "#a2": "restaurant_id"
    },
    ExpressionAttributeValues: {
         ":b": "r201700537" 
    },
    ReturnConsumedCapacity: "TOTAL"
  };*/
  let start_time = Date.now();
  let dataArray = await getBranches();
  //console.log(dataArray);

  console.log("time usage: "+ (Date.now() - start_time));

  console.log(Object.keys(restaurant_cache));
}

main();
