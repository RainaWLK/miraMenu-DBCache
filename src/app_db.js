'use strict';
let item = require('./item/item.js');
let branch_translated = require('./branch/branch_translated.js');

async function writeDB(){
  //tools
  await branch_translated.go();
  await item.go();
}

writeDB();
