const db = require('../common/dynamodb.js');
const utils = require('../common/utils.js');
let I18n = require('../common/i18n.js');
let es = require('../common/elasticsearch.js');
const menuClean = require('./clean.js');
let _ = require('lodash');

const SourceTable = "Menus";
const DestTable = "MenusB2C";

let data_counter = 0;
let db_query_counter = 0;

let id_delete = [];

function makeDestData(dataObj){
  let branchData = dataObj.branch;
  let menusData = dataObj.menus;
  let itemsData = dataObj.items;
  
  let result = [];
  id_delete = [];
  for(let i in menusData) {
    let menuData = menusData[i];
    
    menuData.id = i;

    menuData.restaurant_id = branchData.restaurant_id;
    menuData.restaurant_name = branchData.restaurant_name;
    menuData.branch_id = branchData.branch_id;
    menuData.branch_name = branchData.branch_name;

    menuData.availability = (menuData.availability === false)?false:true;
    delete menuData.resources;
    delete menuData.menuControl;

    if(typeof branchData.i18n === 'object'){
      if(menuData.i18n === undefined){
        menuData.i18n = {};
      }
      
      for(let lang in branchData.i18n){
        if(menuData.i18n[lang] === undefined) {
          menuData.i18n[lang] = {};
        }
        for(let i in branchData.i18n[lang]) {
          menuData.i18n[lang][i] = branchData.i18n[lang][i];
        }
      }
    }
    
    //translate
    if(_.isEmpty(menuData.i18n)){
      delete menuData.i18n;
      menuData.language = 'en-us';
      menuData.menu_id = menuData.id;
      menuData.id = menuData.id+'_'+menuData.language;
      if(menuData.publish === false) {
        id_delete.push(menuData.id);
      } else {
        result.push(menuData);
      }
      
    }
    else {
      for(let lang in menuData.i18n) {
        if(lang === 'default'){
          continue;
        }
        
        let i18n = new I18n.main(JSON.parse(JSON.stringify(menuData)));
        let translatedData = i18n.translate(lang);
        translatedData.language = lang;
        translatedData.menu_id = translatedData.id;
        translatedData.id = translatedData.id+'_'+lang;
        if(menuData.publish === false) {
          id_delete.push(translatedData.id);
        } else {
          result.push(translatedData);
        }
      }
    }
  }

  return result;
}

async function writeDestTable(table, dataArray){
  console.log("start menu write...");
  var params = {
    RequestItems: {}
  };
  params.RequestItems[table] = [];

  try{
    for(let i in dataArray) {
      let data = dataArray[i];
  
      let request = {
        PutRequest: {
          Item: data
        }
      }
      params.RequestItems[table].push(request);
    }
    //clean
    //console.log(JSON.stringify(params));
    let writeResult = await db.batchWrite(params);
    
    await menuClean.clean(id_delete);
    id_delete = [];
  }
  catch(err){
    throw err;
  }
}

function makeEsData(src) {
  let output = _.cloneDeep(src);
  
  delete output.i18n;
  delete output.photos;
  delete output.menuControl;
  delete output.resources;
  
  return output;
}

async function updateEsIndex(destDataArray) {
  let esArray = destDataArray.map(element => makeEsData(element));
  return await es.updateIndex('menus', 'menu_search', esArray);
}

/*
  {
    item_id: {
      id: _____,
      menu_id: _____,
      item_id: _____,
      section_name: '',
      language: ['en-us', 'zh-tw']
    }
  }
*/
/*
async function updateEsIndex_MenuItem(destDataArray) {
  let menuItemObj = {}; //item_id: {id, menu_id, section_name, language...}
  console.log('updateEsIndex_MenuItem');
  
  let makeIndex = destData => {
    if(Array.isArray(destData.sections)) {
      destData.sections.forEach(section => {
        if(Array.isArray(section.items)) {
          for(let i in section.items) {
            let item_id = section.items[i];
            
            if(menuItemObj[item_id] === undefined) {
              menuItemObj[item_id] = {
                id: item_id,
                menu_id: destData.menu_id,
                item_id: item_id,
                section_name: section.name,
                language: []
              };
            }
            if(menuItemObj[item_id].language.find(e => e === destData.language) !== undefined) {
              console.log('item existed:' + item_id);
              console.log('section_name='+section.name);
              console.log('org section_name='+menuItemObj[item_id].section_name);
              console.log('===skip===');
            } else {
              menuItemObj[item_id].language.push(destData.language);
            }
          }
        }
      });
    }
  }
  
  if(Array.isArray(destDataArray)) {
    destDataArray.forEach(element => makeIndex(element));
  } else {
    makeIndex(destDataArray);
  }
  //console.log(menuItemObj);
  //menuItemObj to esDataArray
  let esDataArray = [];
  for(let id in menuItemObj) {
    esDataArray.push(menuItemObj[id]);
  }
  //console.log(esDataArray);
  
  //test
  let tmp = {};
  esDataArray.forEach(e => {
    if(tmp[e.id] === undefined) {
      tmp[e.id] = e;
    } else {
      console.log('dulpicated item:' + e.id);
      console.log(tmp[e.id]);
      console.log(e);
    }
  });

  return await es.updateIndex('menuitem', 'menuItem_search', esDataArray);
}
*/

async function outputDestData(dataObj){
  let destDataArray = [];
  
  //clean deleted b2c data first
  await menuClean.go(dataObj);

  if(Array.isArray(dataObj)){
    dataObj.forEach(data => {
      let destData = makeDestData(data);
  
      destData.forEach(element => {
          destDataArray.push(element);
      });      
    });

  }
  else {
    destDataArray = makeDestData(dataObj);
  }
  //test
  let testExisted = {};
  destDataArray.forEach(element => {
    if(testExisted[element.id] !== undefined) {
      console.log("got dulpicated element!!");
      console.log(element);
    }
    testExisted[element.id] = 1;
  });
  //elasticsearch
  //await updateEsIndex_MenuItem(destDataArray);
  await updateEsIndex(destDataArray);

  //db
  return await writeDestTable(DestTable, destDataArray);  
}

function statistic(){
//  console.log(Object.keys(restaurant_cache));
//  console.log("data counter="+data_counter);
//  console.log("db query counter="+db_query_counter);
}

exports.SourceTable = SourceTable;
exports.outputDestData = outputDestData;
//exports.updateEsIndex_MenuItem = updateEsIndex_MenuItem;

//for test
exports.makeDestData = makeDestData;
