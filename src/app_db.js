'use strict';
let branch_all = require('./branch/branch_all.js');
let item_all = require('./item/item_all.js');


async function writeDB(){
  //tools
  //await branch_all.go();
  await item_all.go();
}

writeDB();
