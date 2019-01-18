let AWS = require('aws-sdk');
const ecs = new AWS.ECS({region: 'us-west-2'});
const ec2 = new AWS.EC2({region: 'us-west-2'});

const es = require('./common/elasticsearch.js');
let item_es = require('./item/init_es.js');
let menu_es = require('./menu/init_es.js');
let branch_es = require('./branch/init_es.js');
let menuitem_es = require('./menuItem/init_es.js');


async function getInstanceIp(cluster, containerInstanceArn) {
  try {
    let arn = [];
    arn.push(containerInstanceArn);
    console.log(arn);
    containerInstanceData = await ecs.describeContainerInstances({ containerInstances: arn, cluster: cluster }).promise();
    console.log('containerInstanceData=');
    console.log(containerInstanceData);
    //let ids = [];
    //ids.push();
    //console.log(ids);
    instanceData = await ec2.describeInstances({ InstanceIds: [ containerInstanceData.containerInstances[0].ec2InstanceId ] }).promise();
    console.log('instanceData=');
    console.log(instanceData);

    console.log(instanceData.Reservations[0].Instances[0]);

    return instanceData.Reservations[0].Instances[0].PublicIpAddress;
  }
  catch(err) {
    console.error(err);
    throw err;
  }
}


async function writeES(event, callback){
  try {
    let cluster = event.detail.clusterArn;
    let containerInstanceArn = event.detail.containerInstanceArn;
    console.log('cluster='+cluster);
    console.log('containerInstanceArn='+containerInstanceArn);
    let ip = await getInstanceIp(cluster, containerInstanceArn);
    await es.connect(`http://${ip}:9200`);

    console.log('writeES');
    await branch_es.go();
    await item_es.go();
    await menu_es.go();
    await menuitem_es.go();
  }
  catch(err) {
    console.log("writeES error");
    throw err;
  }

  callback(null, "OK")
}

//writeES();

exports.writeES = writeES;