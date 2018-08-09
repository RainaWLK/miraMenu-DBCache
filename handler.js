'use strict';
let AWS = require('aws-sdk');
let app = require('./build/app.js');


function main(src, event, context, callback) {
  //console.log(event);
  //console.log(context);
  //console.log(event.Records[0].dynamodb);
  
  let key = event.Records[0].dynamodb.Keys.id.S;
  let newImage = AWS.DynamoDB.Converter.unmarshall(event.Records[0].dynamodb.NewImage);  
  //console.log(key);
  //console.log(newImage);
  
  app.main(src, newImage).then(data => {
    console.log('job done');
    callback(null, JSON.stringify(data)); 
  }).catch(err => {
    callback(err); 
  });


  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  //callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });

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
  console.log(context);
  console.log(event.detail.attributes);

  callback(null, "OK");
}