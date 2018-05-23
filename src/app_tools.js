'use strict';
let restaurant = require('./restaurant.js');
let branch = require('./branch.js');
let item = require('./item.js');
let branch_translated = require('./branch_translated.js');

async function tools(){
  //tools
  //let b2cRestaurantDataArray = await restaurant.go();
  //let b2cBranchDataArray = await branch.go();
  //let b2cItemDataArray = await item.go();
  
  let b2cBranchNewDataArray = await branch_translated.go();
  
}

tools();
