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
    return result;
  }
  catch(err) {
    throw err;
  }
}

exports.main = main;
exports.deleteData = deleteData;