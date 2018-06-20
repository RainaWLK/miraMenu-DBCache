'use strict';
let item_es = require('./item/init_es.js');
let branch_es = require('./branch/init_es.js');

async function writeES(){
  await branch_es.go();
  await item_es.go();
}

writeES();
