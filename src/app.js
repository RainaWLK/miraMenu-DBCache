'use strict';
let restaurant = require('./restaurant.js');
let branch = require('./branch.js');
let item = require('./item.js');
let branch_translated = require('./branch_translated.js');

let update_restaurant = require('./update_restaurant.js');
let update_branch = require('./update_branch.js');
//let clone = require('./clone.js');

/*function parseMessageAttribute(messageAttributes){
  let result = {};

  for(let key in messageAttributes){
    if(messageAttributes[key].Type === 'String'){ //drop binary attribute
      result[key] = messageAttributes[key].Value;
    }
  }
  return result;
}*/

async function main(src, newImage){
  let result;
  try {
    switch(src){
      case 'Restaurant':
        result = await update_restaurant.update(newImage);
        break;
      case 'Branch':
        result = await update_branch.update(newImage);
        break;
      case 'Menu':
        break;
      case 'Item':
        break;
    }
    return result;
  }
  catch(err) {
    throw err;
  }
}

exports.main = main;
