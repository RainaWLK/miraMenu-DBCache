'use strict';
let item_es = require('./item/init_es.js');
let menu_es = require('./menu/init_es.js');
let branch_es = require('./branch/init_es.js');
let menuitem_es = require('./menuItem/init_es.js');

async function writeES(){
  try {
    await branch_es.go();
    await item_es.go();
    await menu_es.go();
    await menuitem_es.go();
  }
  catch(err) {
    console.log("writeES error");
    throw err;
  }
}

writeES();
