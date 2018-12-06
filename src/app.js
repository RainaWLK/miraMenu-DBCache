let update_branch = require('./branch/update.js');
let update_item = require('./item/update.js');
let update_menuitem = require('./menuItem/update.js');
const utils = require('./common/utils.js');

/*function parseMessageAttribute(messageAttributes){
  let result = {};

  for(let key in messageAttributes){
    if(messageAttributes[key].Type === 'String'){ //drop binary attribute
      result[key] = messageAttributes[key].Value;
    }
  }
  return result;
}*/

const delay = (interval) => {
    return new Promise((resolve) => {
        setTimeout(resolve, interval);
    });
};

async function deleteData(src, newImage) {
  let result;
  try {
    switch(src){
      case 'Branch':
        result = await update_branch.deleteData(newImage);
        break;
      case 'Item':
        result = await update_item.deleteData(newImage);
        break;
    }
    return result;
  }
  catch(err) {
    throw err;
  }
}

async function main(src, newImage){
  let result;
  try {
    switch(src){
      case 'Branch':
        result = await update_branch.update(newImage);
        break;
      case 'Item':
        result = await update_item.update(newImage);
        break;
    }
    
    //menuItem
    await delay(1000);
    let idArray = utils.parseID(newImage.id);
    let restaurant_id = 'r' + idArray.r;
    await update_menuitem.update(restaurant_id);
    
    return result;
  }
  catch(err) {
    throw err;
  }
}

exports.main = main;
exports.deleteData = deleteData;