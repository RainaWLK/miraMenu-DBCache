'use strict';

var QRCode = require('qrcode');

function createQRCode(msg) {
  var options = {
    color: {
      dark: '#000', // Blue dots
      light: '#0000' // Transparent background
    },
    errorCorrectionLevel: 'H',
    version: 6,
    type: 'svg'
  };

  return new Promise(function (resolve, reject) {
    QRCode.toString(msg, options, function (err, string) {
      if (err) {
        reject(err);
        return;
      }
      resolve(string);
    });
  });
}

exports.createQRCode = createQRCode;