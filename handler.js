'use strict';
require('babel-polyfill');
let app = require('./build/app.js');

module.exports.main = (event, context, callback) => {
  //console.log(event);
  //console.log(context);
  //console.log(event.Records[0].Sns);

  app.main(event.Records[0].Sns).then(data => {
    console.log('job done');
    callback(null, JSON.stringify(data)); 
  }).catch(err => {
    callback(err); 
  });



  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  //callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
