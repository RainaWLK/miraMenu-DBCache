'use strict';
let restaurant = require('./restaurant.js');
let branch = require('./branch.js');
let item = require('./item.js');

let update_restaurant = require('./update_restaurant.js');
let update_branch = require('./update_branch.js');
//let clone = require('./clone.js');

function parseMessageAttribute(messageAttributes){
  let result = {};

  for(let key in messageAttributes){
    if(messageAttributes[key].Type === 'String'){ //drop binary attribute
      result[key] = messageAttributes[key].Value;
    }
  }
  return result;
}

async function route(inputData, attr){
  let result;
  try {
    console.log(attr.table);
    switch(attr.table){
      case 'Restaurants':
        result = await update_restaurant.update(inputData, attr);
        break;
      case 'Branches':
        result = await update_branch.update(inputData, attr);
        break;
      case 'Menus':
        break;
    }
    return result;
  }
  catch(err) {
    throw err;
  }
}

async function tools(){
  //tools
  //let b2cRestaurantDataArray = await restaurant.go();
  //let b2cBranchDataArray = await branch.go();
  let b2cItemDataArray = await item.go();

  //backup
  //await clone.go("MenusBak", "Menus");
}

async function main(sns){
  console.log("message:");
  let msg = JSON.parse(sns.Message);
  console.log(msg);

  console.log("attribute:");
  let msgAttrs = parseMessageAttribute(sns.MessageAttributes);
  console.log(msgAttrs);

  return await route(msg, msgAttrs);
}

tools();
exports.main = main;
