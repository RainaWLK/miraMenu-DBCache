let db = require('./dynamodb.js');
const redis = require('redis');
const client = redis.createClient({
  url: 'redis://miramenucache.5mm6cs.ng.0001.use1.cache.amazonaws.com:6379',
  retry_strategy: function(options) {
    console.log(options)
    if (options.total_retry_time > 1000) {
      throw new Error('can`t connect to redis')
    }
  }
})


function start_redis(){
  console.log("connecting to redis server...");
  return new Promise((resolve, reject) => {
    client.on('connect', () => {
      console.log('connected');
      resolve();
    });
  });

}

function setData(key, value){
  return new Promise((resolve, reject) => {
    client.set(key, value, (err, reply) => {
      if(err){
        console.log(err);
        reject(err);
      }
      else{
        console.log(reply);
        resolve(reply);
      }
    });
  });
}


async function main(){
  await start_redis();

  var params = {
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
  };
  let dataArray = await db.scanDataByFilter(params);
  dataArray.map(async data => {
    for(let i in data){
      if(typeof data[i] === 'string'){
        await setData(i, data[i]);
        console.log(`set key=${i}, value=${data[i]}`);
      }
    }
  });
}

main();
