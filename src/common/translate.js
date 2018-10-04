let _ = require('lodash');
const AWS = require('aws-sdk');
const translate = new AWS.Translate({
  region: 'us-west-2'
});

const awsLanguageCode = {
  Arabic: 'ar',
  'zh-cn': 'zh',
  'zh-tw': 'zh-TW',
  'zh-hk': 'zh-TW',
  Czech: 'cs',
  'en-us': 'en',
  fr: 'fr',
  de: 'de',
  it: 'it',
  'ja-jp': 'ja',
  Portuguese: 'pt',
  ru: 'ru',
  es: 'es',
  Turkish: 'tr'
};

async function doTranstale(sourceLang, targetLang, text) {
  try {
    let sourcelangCode = awsLanguageCode[sourceLang.toLowerCase()];
    if(sourcelangCode === undefined) {
      return null;
    }
  
    let targetlangCode = awsLanguageCode[targetLang.toLowerCase()];
    if(targetlangCode === undefined) {
      return null;
    }

    //aws translate support english translation only
    if(sourcelangCode !== 'en' && targetlangCode !== 'en') {
      return null;
    }

    if(_.isEmpty(text)) {
      return null;
    }

    var params = {
      SourceLanguageCode: sourcelangCode,
      TargetLanguageCode: targetlangCode,
      Text: text
    };
    let data = await translate.translateText(params).promise();
    return data.TranslatedText;
  }
  catch(err) {
    console.log(err, err.stack); // an error occurred
    return null;
  }
}

exports.doTranstale = doTranstale;