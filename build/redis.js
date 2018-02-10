'use strict';

//this is my backup of redis practice....

var redis = require('redis');
var client = redis.createClient({
  url: 'redis://miramenucache.5mm6cs.ng.0001.use1.cache.amazonaws.com:6379',
  retry_strategy: function retry_strategy(options) {
    console.log(options);
    if (options.total_retry_time > 1000) {
      throw new Error('can`t connect to redis');
    }
  }
});

function start_redis() {
  console.log("connecting to redis server...");
  return new Promise(function (resolve, reject) {
    client.on('connect', function () {
      console.log('connected');
      resolve();
    });
  });
}

function setData(key, value) {
  return new Promise(function (resolve, reject) {
    client.set(key, value, function (err, reply) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log(reply);
        resolve(reply);
      }
    });
  });
}