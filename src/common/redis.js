//this is my backup of redis practice....

const redis = require('redis');
const client = redis.createClient({
  url: 'redis://miramenucache.5mm6cs.ng.0001.use1.cache.amazonaws.com:6379',
  retry_strategy: function(options) {
    console.log(options)
    if (options.total_retry_time > 1000) {
      throw new Error('can`t connect to redis')
    }
  }
});

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