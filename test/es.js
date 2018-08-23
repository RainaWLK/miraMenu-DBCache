const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;
const es = require('../src/common/elasticsearch.js');

chai.use(require('chai-things'));

const ES_INDEX = "es_test";
const ES_INDEX_TYPE = "_doc";

describe('unit test for ES', () => {
  let esClient = null;

  let chinese_analyzer = {
    type: 'text',
    analyzer: 'ik_smart'
  };
  
  let body = {
    properties: {
      "name": chinese_analyzer,
      "desc": chinese_analyzer
    }
  };
  
  let sample = [
    {
      id: '0',
      name: 'test0',
      desc: 'test data no.0'
    },
    {
      id: '1',
      name: 'test1',
      desc: 'test data no.1'
    },
    {
      id: '2',
      name: 'test2',
      desc: 'test data no.2'
    }
  ]

  before('before', async () => {
    esClient = await es.initIndex(ES_INDEX, ES_INDEX_TYPE, body);
    console.log('connect done');
  });

  it('test index init', async () => {
    let results = await esClient.indices.getMapping({
      index: ES_INDEX,
      type: ES_INDEX_TYPE
    });
    
    expect(results[ES_INDEX].mappings[ES_INDEX_TYPE]).to.deep.equal(body);
  });

  it('add data ', async () => {
    let testData = [];
    testData.push(sample[0]);
    testData.push(sample[1]);
    
    let result = await es.updateIndex(ES_INDEX, ES_INDEX_TYPE, testData);
    expect(result.errors).to.be.false;
  });
  
  it('add single data ', async () => {
    let testData = sample[2];
    
    let result = await es.updateIndex(ES_INDEX, ES_INDEX_TYPE, testData);
    expect(result.errors).to.be.false;
  });
  
  describe('test data add successful',() => {
    for(let i in sample) {
      let testData = sample[i];
      
      it('data id: '+testData.id+' existed', async () => {
        let result = await es.getIndex(ES_INDEX, ES_INDEX_TYPE, testData.id);
        expect(result).to.be.deep.equal(testData);
      });
    }
  });
  
  describe('test update data successful ', () => {
    let testData = _.cloneDeep(sample[2]);
    testData.desc = 'updated test data no.2';
    
    it('update data', async () => {
      let result = await es.updateIndex(ES_INDEX, ES_INDEX_TYPE, testData);
      expect(result.errors).to.be.false;
    });
    it('check data updated', async () => {
      let result = await es.getIndex(ES_INDEX, ES_INDEX_TYPE, testData.id);
      expect(result).to.be.deep.equal(testData);
    });
  });
  
  describe('search', () => {
    it('search keyword: test', async () => {
      await sleep(1000);  //wait analyzer done
      
      let search_body = {
        query: {
          multi_match: {
            query: 'test1',
            fields: ['name', 'desc'],
            fuzziness: 1
          }
        }
      };
      let result = await es.search('es_test', search_body);
      expect(result).to.include.something.deep.equals(sample[0]);
      expect(result).to.all.have.property('id');
    });
  });
  
  describe('delete index', () => {
    it('delete index id: 1', async () => {
      await es.deleteIndex(ES_INDEX, ES_INDEX_TYPE, '1');
    });
    
    it('check index id: 1 deleted', async () => {
      let result = await esClient.exists({
        index: ES_INDEX,
        type: ES_INDEX_TYPE,
        id: '1'
      });
      expect(result).to.be.false;
    });
    
    it('check other index id existed: 2', async () => {
      let result = await esClient.exists({
        index: ES_INDEX,
        type: ES_INDEX_TYPE,
        id: '2'
      });
      expect(result).to.be.true;
    });
  });

  after('after', async () => {
    await es.deleteIndice(ES_INDEX);
    let result = await esClient.cat.indices({v: true});
    console.log(result);
    console.log('clear done');
  });

});


function sleep(wait = 0) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, wait);
  })
};