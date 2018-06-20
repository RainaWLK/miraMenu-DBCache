'use strict';
//let update_restaurant = require('./update_restaurant.js');
let update_branch = require('./branch/update.js');
let update_item = require('./item/update.js');

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
      //case 'Restaurant':
      //  result = await update_restaurant.update(newImage);
      //  break;
      case 'Branch':
        result = await update_branch.update(newImage);
        break;
      case 'Menu':
        break;
      case 'Item':
        result = await update_item.update(newImage);
        break;
    }
    return result;
  }
  catch(err) {
    throw err;
  }
}

exports.main = main;
