const db = require('../common/dynamodb.js');
const utils = require('../common/utils.js');
let I18n = require('../common/i18n.js');
let es = require('../common/elasticsearch.js');
const itemClean = require('./clean.js');
let _ = require('lodash');

async function getBranches(restaurant_id){
  try {
    //get branch ids from restaurant
    let params = {
      TableName: "Restaurants",
      KeyConditionExpression: "#n = :n",
      ExpressionAttributeNames:{
          "#n": "id"
      },
      ExpressionAttributeValues: {
          ":n": restaurant_id
      }
    };

    let restaurantResult = await db.query(params);
    if(typeof restaurantResult[0] !== 'object' || 
       typeof restaurantResult[0].restaurantControl !== 'object') {
      throw null;
    }
    let branch_ids = restaurantResult[0].restaurantControl.branch_ids;
    if(_.isEmpty(branch_ids)) {
      throw null;
    }
    
    //get branches
    params = {
      RequestItems: {}
    };
    params.RequestItems['Branches'] = {
      Keys: branch_ids.map(id => {
        return {'id': restaurant_id+id}
      })
    };
    let branchResult = await db.batchGet(params);

    return branchResult.Responses.Branches;
  }
  catch(err){
    //console.log(err);
    throw null;
  }

}

async function getMenus(menu_ids) {
  //use elasticsearch because dynamodb didn't support search by menu_id
  let body = {
    size: 9999,
    from: 0,
    "query": {
      "terms" : {
        "menu_id" : menu_ids
      }
    },
    sort: [
      { "menu_id": "desc" },
      "_score"
    ]
  };
  
  let response = await es.simpleSearch('menus', body);
  return response.hits.hits.map(e => e._source);
}

/*
  {
    menu_id: [branch_id, branch_id]
  }
*/
async function getSourceData(restaurant_id){
  try {
    let branchDataArray = await getBranches(restaurant_id);
    
    let menuByBranch = {};
    //get branch menus
    branchDataArray.filter(e => typeof e.menus === 'object').forEach(branch => {
      branch.menus.forEach(menu_id => {
        if(menuByBranch[menu_id] === undefined) {
          menuByBranch[menu_id] = [];
        }
        menuByBranch[menu_id].push(branch.id);
      });
    });
    
    //menu array
    let menu_ids = [];
    for(let i in menuByBranch) {
      menu_ids.push(i);
    }
    
    //get menus
    let menusArray = await getMenus(menu_ids);
    //console.log(menusArray);
    return {
      menuByBranch: menuByBranch,
      menus: menusArray
    };
  }
  catch(err) {
    //console.log(err);
    throw null;
  }
}

/*
  [
    {
      item_id: item_id,
      menu: [
        {
          menu_id: menu_id,
          branches: [branch_id, branch_id]
        }
      ]
    }
  ]
*/
function makeDestData(dataObj) {
  //items
  /*
    {
      item_id: {
        menu_id: [branch_id, branch_id],
        menu_id: [branch_id, branch_id]
      }
    }
  */
  let itemByMenu = {};
  dataObj.menus.filter(e => Array.isArray(e.sections))
  .map(menu => {
    menu.sections.filter(e => Array.isArray(e.items) && e.items.length > 0)
    .forEach(section => {
      section.items.forEach(item_id => {
        if(itemByMenu[item_id] === undefined) {
          itemByMenu[item_id] = {};
        }
        //combine
        if(itemByMenu[item_id][menu.menu_id] === undefined) {
          itemByMenu[item_id][menu.menu_id] = dataObj.menuByBranch[menu.menu_id];
        }
      });
    });
    
  });

  if(_.isEmpty(itemByMenu)){
    throw null;
  }
  //transform to output format
  let outputArray = [];
  for(let item_id in itemByMenu) {
    let itemData = {};
    itemData.item_id = item_id;
    itemData.menu = [];
    for(let menu_id in itemByMenu[item_id]) {
      let menuData = {
        menu_id: menu_id,
        branches: itemByMenu[item_id][menu_id]
      }
      itemData.menu.push(menuData);
    }
    outputArray.push(itemData);
  }
  
  return outputArray;
}

async function updateEsIndex(esArray) {
  //console.log('esArray=');
  //console.log(esArray);
  return await es.updateIndex('menuitem_new', 'menuItem_search', esArray);
}

async function update(restaurant_id) {
  try {
    const dataObj = await getSourceData(restaurant_id);
  
    let itemsByMenuArray = makeDestData(dataObj);
    
    //clean deleted b2c data first
    //await itemClean.go(dataObj);
  
    await updateEsIndex(itemsByMenuArray);
  }
  catch(err) {
    //skip
    console.log('skip: ' + restaurant_id);
    return;
  }
}


//test
//update('r1528125059703');
//update('r1531207779057');


exports.update = update;

//for test
exports.getSourceData = getSourceData;
exports.makeDestData = makeDestData;