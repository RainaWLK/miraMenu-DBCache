'use strict';
let AWS = require('aws-sdk');
let app = require('./build/app.js');
let app_es = require('./build/app_es.js');

function main(src, event, context, callback) {
  console.log(event);
  console.log(context);
  
  for(let i in event.Records) {
    let record = event.Records[i];
    let newImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
    console.log(JSON.stringify(newImage));

    let result = null;
    if(record.eventName === 'REMOVE') {
      result = app.deleteData(src, record.dynamodb.Keys.id.S);
    }
    else {
      result = app.main(src, newImage);
    }
    
    result.then(data => {
      console.log('job done');
      callback(null, JSON.stringify(data)); 
    }).catch(err => {
      callback(err); 
    });
  }
}

module.exports.updateBranch = (event, context, callback) => {
  return main("Branch", event, context, callback);
};


module.exports.updateRestaurant = (event, context, callback) => {
  return main("Restaurant", event, context, callback);
};

module.exports.updateItem = (event, context, callback) => {
  return main("Item", event, context, callback);
};

module.exports.initES = (event, context, callback) => {
  console.log('initES');
  console.log(event);

  let desiredStatus = event.detail.desiredStatus;
  let lastStatus = event.detail.desiredStatus;
  console.log('desiredStatus='+desiredStatus);
  console.log('lastStatus='+lastStatus);

  if(desiredStatus === 'RUNNING' && lastStatus === 'RUNNING') {
    console.log('run init es');
    return app_es.writeES(event, callback);
  }
  else {
    return callback(null, "OK");
  }
}