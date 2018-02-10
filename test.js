var AWS = require("aws-sdk"); // must be npm installed to use
var sns = new AWS.SNS({
  endpoint: "http://127.0.0.1:4002",
  region: "us-west-2",
});

let msg_restaurant = {
  "photos":{
    "p1515322406865-1":{
      "size":{
        "width":1108,
        "height":1478
      },
      "mimetype":"image/jpeg",
      "url":{
        "small":"https://cdn.mira.menu/restaurants/r1515316110281/photos/p1515322406865-1_small.jpg",
        "huge":"https://cdn.mira.menu/restaurants/r1515316110281/photos/p1515322406865-1_huge.jpg",
        "original":"https://cdn.mira.menu/restaurants/r1515316110281/photos/p1515322406865-1.jpg",
        "medium":"https://cdn.mira.menu/restaurants/r1515316110281/photos/p1515322406865-1_medium.jpg",
        "large":"https://cdn.mira.menu/restaurants/r1515316110281/photos/p1515322406865-1_large.jpg"
      }
    },
    "p1515322406487-0":{
      "mimetype":"image/jpeg",
      "role":"logo",
      "size":{
        "width":2560,
        "height":1440
      },
      "url":{
        "small":"https://cdn.mira.menu/restaurants/r1515316110281/photos/p1515322406487-0_small.jpg",
        "huge":"https://cdn.mira.menu/restaurants/r1515316110281/photos/p1515322406487-0_huge.jpg",
        "original":"https://cdn.mira.menu/restaurants/r1515316110281/photos/p1515322406487-0.jpg",
        "medium":"https://cdn.mira.menu/restaurants/r1515316110281/photos/p1515322406487-0_medium.jpg",
        "large":"https://cdn.mira.menu/restaurants/r1515316110281/photos/p1515322406487-0_large.jpg"
      }
    }
  },
  "social":{
    "web":"https://wow.gamepedia.com/Nomi"
  },
  "i18n":{
    "res-i18n-1515316110345-2":{
      "data":{"en-us":"Chinese"},
      "default":"en-us"
    },
    "res-i18n-1515316110307-0":{
      "data":{"en-us":"Nomi\'s Burning Kitchen"},
      "default":"en-us"
    },
    "res-i18n-1515316110325-1":{
      "data":{"en-us":"Nomi is a pandaren boy who is ready and willing to learn cooking from the teacher when summoned by the [Cooking School Bell]. He offers a series of daily quests to help improve his cooking, beginning with Lesson 1 and eventually progressing to Lesson 5. Once Nomi has completed his learning, he will give a one-time quest to thank his teacher. From thereon, the adventurer will have access to the daily quest which rewards an [Ironpaw Token] and [Goodies from Nomi] (contains a random skill level 600 food).\\n\\nNomi and Andi know each other. Afraid of Farmer Fung, Nomi is of the opinion that he eats cubs.[3]\\n\\nOnce he got old enough, Nomi tried adventuring for a bit, but found cooking to be his passion.[1] Now a teenager, he caught up with his old master in the Broken Isles with an offer to work together once again. Soon after, Nomi got work at a kitchen in Dalaran.\\n\\nHe\'s also not very good at hunting or fishing."},
      "default":"en-us"
    },
    "res-i18n-1515316110345-3":{
      "data":{"en-us":"Broken isles Dalaran, Azeroth"},
      "default":"en-us"
    }
  },
  "resources":{},
  "category":"Chinese",
  "tel":"(099)12345671",
  "address":"Broken isles Dalaran, Azeroth",
  "restaurantControl":{
    "owner":"us-east-1:de51bb08-a40b-488e-8a6a-72ded4d3167b",
    "branchesMaxID":"s0",
    "branch_ids":["s1515320809386"]
  },
  "name":"Nomi\'s Burning Kitchen",
  "desc":"Nomi is a pandaren boy who is ready and willing to learn cooking from the teacher when summoned by the [Cooking School Bell]. He offers a series of daily quests to help improve his cooking, beginning with Lesson 1 and eventually progressing to Lesson 5. Once Nomi has completed his learning, he will give a one-time quest to thank his teacher. From thereon, the adventurer will have access to the daily quest which rewards an [Ironpaw Token] and [Goodies from Nomi] (contains a random skill level 600 food).\\n\\nNomi and Andi know each other. Afraid of Farmer Fung, Nomi is of the opinion that he eats cubs.[3]\\n\\nOnce he got old enough, Nomi tried adventuring for a bit, but found cooking to be his passion.[1] Now a teenager, he caught up with his old master in the Broken Isles with an offer to work together once again. Soon after, Nomi got work at a kitchen in Dalaran.\\n\\nHe\'s also not very good at hunting or fishing.",
  "geolocation":{
    "zipcode":"111"
  },
  "id":"r1515316110281"
};


let attr_restaurant = {
  method: {
    DataType: 'String',
    StringValue: 'PUT' 
  },
  id: {
    DataType: 'String',
    StringValue: 'r1515316110281'
  },
  table: { 
    DataType: 'String',
    StringValue: 'Restaurants' 
  } 
};

let msg_branch = { social: { web: 'https://wow.gamepedia.com/Nomi' },
i18n: 
{ 'res-i18n-1515320809387-1': { data: [Object], default: 'en-us' },
'res-i18n-1515320809388-2': { data: [Object], default: 'en-us' },
'res-i18n-1515320809388-5': { data: [Object], default: 'en-us' },
'res-i18n-1515320809387-0': { data: [Object], default: 'en-us' } },
capacity: '10',
currency: 'Gold',
branchControl: 
{ itemsMaxID: 'i000',
tablesMaxID: 't000',
menusMaxID: 'm000',
branch_id: 's1515320809386',
restaurant_id: 'r1515316110281' },
address: 'Broken isles, Daralan, Azeroth',
branch_hours: 'Mon 9:00-12:00, 17:00-23:00; Tue 6:00-9:00, 11:00-13:30, 17:00-23:00',
name: 'Daralan',
desc: 'Because of Nomi constantly burning food he has received a lot of animosity from the player-base in Legion, even causing the creation of memes around it.\nThis resulted in Nomi becoming an attackable raid boss for one night, on March 10, 2017 on the Patch 7.2.0 PTR as part of a server stress test. He had the ability to rain fires upon those daring to defy him, and had quotes from encounters from prominent members of the Burning Legion such as Lord Jaraxxus and Gul\'dan.[5]',
geolocation: { zipcode: '111' },
photos: {},
resources: {},
category: 'Chinese',
tel: '(1)12345670',
tables: {},
total_table: '2',
id: 'r1515316110281s1515320809386' 
};

let attr_branch = {
  method: {
    DataType: 'String',
    StringValue: 'PUT' 
  },
  id: {
    DataType: 'String',
    StringValue: 'r1515316110281s1515320809386'
  },
  table: { 
    DataType: 'String',
    StringValue: 'Branches' 
  } 
};


sns.publish({
  //Message: JSON.stringify(msg_restaurant),
  //MessageAttributes: attr_restaurant,
  Message: JSON.stringify(msg_branch),
  MessageAttributes: attr_branch,
//  MessageStructure: "json",
//  TopicArn: "arn:aws:sns:us-east-1:552950262288:DBUpdate",
  TopicArn: "arn:aws:sns:us-west-2:123456789012:DBUpdate"
}, (err, data) => {
  console.log(err);
  console.log(data);
  console.log("ping");
});
