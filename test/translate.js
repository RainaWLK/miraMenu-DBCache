const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;
const translate = require('../src/common/translate.js');

chai.use(require('chai-things'));


describe('unit test for AWS translate', () => {
  it('蘋果', async () => {
    let result = await translate.doTranstale('zh-TW', 'en-us', '蘋果');
    expect(result).to.be.equal('Apple');
  });

  it('りんご', async () => {
    let result = await translate.doTranstale('ja-JP', 'en-us', 'りんご');
    expect(result).to.be.equal('Apples');
  });

  it('らーまん', async () => {
    let result = await translate.doTranstale('ja-JP', 'en-us', 'らーまん');
    expect(result).to.be.equal('Raman');
  });

  it('Apple to 蘋果', async () => {
    let result = await translate.doTranstale('en-us', 'zh-tw', 'Apple');
    expect(result).to.be.equal('蘋果');
  });

  it('Apple to りんご', async () => {
    let result = await translate.doTranstale('en-us', 'ja-jp', 'Apples');
    expect(result).to.be.equal('リンゴ');
  });

  it('Raman to らーまん', async () => {
    let result = await translate.doTranstale('en-us', 'ja-jp', 'Raman');
    expect(result).to.be.equal('ラマン');
  });

});