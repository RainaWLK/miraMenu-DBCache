const chai = require('chai');
const expect = chai.expect;
const item = require('../src/item/update.js');
let sample = require('./sample.json');

chai.use(require('chai-things'));

describe('***test items***', () => {

describe('test source data', () => {
  let sourceData;
  before(async () => {
    sourceData = await item.getSourceData(sample);
  });
  
  it('check source data: branch', () => {
    expect(sourceData).to.have.property('branch');
  });
  it('check source data: menus', () => {
    expect(sourceData).to.have.property('menus');
  });
  it('check source data: items', () => {
    expect(sourceData).to.have.property('items');
  })

});

describe('test dest data', async () => {
  let sourceData;
  let destDataArray;
  
  before('after', (done) => {
    console.log('run before');
  });
  
  sourceData = await item.getSourceData(sample);
  destDataArray = item.makeDestData(sourceData);
  
  it('dest data is array', () => {
    expect(destDataArray).to.be.a('array');
  });
  
  describe('check translation by each language', () => {
    for(let itemId in sourceData.items) {
      let i18n = sourceData.items[itemId].i18n;
      
      for(let lang in i18n) {
        if(lang === 'default'){
          continue;
        }
        
        let newId = itemId + '_' + lang;
        
        it(`check ${newId} translated`, () => {
          expect(destDataArray).to.include.something.property('id', newId);
        });
      }
    }

  });
  
  describe('check dest data:', () => {
    destDataArray.forEach(destData => {
      let newIdArray = destData.id.split('_');
      let id = newIdArray[0];
      let lang = newIdArray[1];
      let itemSource = sourceData.items[id];
        
      describe('check dest data: '+destData.id, () => {
        it('id type should be string', () => {
          expect(destData.id).to.be.a('string');
        });
        it(`id should be correct:${id}`, () => {
          expect(id).to.equal(itemSource.id);
          expect(id).to.equal(destData.item_id);
        });
        it(`language should be correct:${lang}`, () => {
          expect(destData.language).to.equal(lang);
        });
        it(`include branch id:${destData.branch_id}`, () => {
          expect(destData.branch_id).to.equal(sourceData.branch.branch_id);
        });
        
        it(`check translated name: ${destData.name}`, () => {
          let name_translated = itemSource.name;
          if(itemSource.name.startsWith('i18n::')) {
            let name = itemSource.name.replace('i18n::', '');

            name_translated = itemSource.i18n[lang][name];
            // translate to default str mechanism
            if(name_translated === undefined) {
              name_translated = itemSource.i18n[itemSource.i18n.default][name];
            }
          }

          expect(destData.name).to.equal(name_translated);
        });
      });
    });
  });

  
  run();  
});

});