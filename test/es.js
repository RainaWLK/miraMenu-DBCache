const chai = require('chai');
const expect = chai.expect;
const es = require('../src/common/elasticsearch.js');

chai.use(require('chai-things'));

const ES_INDEX = "es_test";
const ES_FIELD = "es_test_field";

describe('run test', async () => {
  let chinese_analyzer = {
    type: 'text',
    analyzer: 'ik_smart',
    search_analyzer: 'ik_smart'
  };
  
  let body = {
    properties: {
      name: chinese_analyzer,
      desc: chinese_analyzer
    }
  };


  let esClient = await es.initIndex(ES_INDEX, ES_FIELD, body);
  console.log(esClient);


  it('test index existed', async () => {
    let results = await esClient.indices.getMapping({
      index: ES_INDEX,
      type: ES_FIELD
    });
    console.log(results[ES_INDEX].mappings[ES_FIELD]);
  });



  await es.deleteIndex(ES_INDEX);
  
  console.log('clear done');

  run();
});

