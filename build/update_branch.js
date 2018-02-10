'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var getRestaurant = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(restaurant_id) {
    var restaurantData;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            console.log("db query:" + restaurant_id);
            _context.prev = 1;
            _context.next = 4;
            return db.queryById("Restaurants", restaurant_id);

          case 4:
            restaurantData = _context.sent;

            //db_query_counter++;
            console.log("got " + restaurant_id);
            return _context.abrupt('return', restaurantData);

          case 9:
            _context.prev = 9;
            _context.t0 = _context['catch'](1);

            console.log(restaurant_id + " not found");
            throw null;

          case 13:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[1, 9]]);
  }));

  return function getRestaurant(_x) {
    return _ref.apply(this, arguments);
  };
}();

var getSourceData = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(branchData) {
    var restaurantData;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return getRestaurant(branchData.branchControl.restaurant_id);

          case 3:
            restaurantData = _context2.sent;
            return _context2.abrupt('return', {
              "restaurant": restaurantData,
              "branch": branchData
            });

          case 7:
            _context2.prev = 7;
            _context2.t0 = _context2['catch'](0);
            throw null;

          case 10:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[0, 7]]);
  }));

  return function getSourceData(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var makeDestData = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(dataObj) {
    var restaurantData, result, has_logo, has_main, i, _i, photoData, _i2, idArray, path, url, s3path, qrcodeStr, s3result;

    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            restaurantData = dataObj.restaurant;
            result = dataObj.branch;

            result.restaurant_id = restaurantData.id;
            result.restaurant_name = restaurantData.name;
            result.branch_name = result.name;
            delete result.name;

            result.availability = result.availability === false ? false : true;

            //photos
            has_logo = false;
            has_main = false;

            for (i in result.photos) {
              if (result.photos[i].role === 'logo') {
                has_logo = true;
              } else if (result.photos[i].role === 'main') {
                has_main = true;
              }
            }
            //merge restaurant photo into branch
            for (_i in restaurantData.photos) {
              photoData = restaurantData.photos[_i];

              if (has_logo && photoData.role === 'logo' || has_main && photoData.role === 'main') {
                delete photoData.role;
              }
              result.photos[_i] = restaurantData.photos[_i];
            }

            //i18n
            if (_typeof(restaurantData.i18n) === 'object') {
              if (result.i18n === undefined) {
                result.i18n = {};
              }

              for (_i2 in restaurantData.i18n) {
                result.i18n[_i2] = restaurantData.i18n[_i2];
              }
            }

            //qr code
            idArray = utils.parseID(result.id);
            path = 'restaurants/r' + idArray.r + '/branches/s' + idArray.s;
            url = 'https://mira.menu/' + path;
            s3path = path + '/qrcode/qrcode.svg';
            _context3.next = 18;
            return qrcode.createQRCode(url);

          case 18:
            qrcodeStr = _context3.sent;
            _context3.next = 21;
            return s3.uploadToS3(qrcodeStr, s3path, 'image/svg+xml');

          case 21:
            s3result = _context3.sent;

            result.qrcode = 'https://cdn.mira.menu/' + s3result.key;

            return _context3.abrupt('return', result);

          case 24:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function makeDestData(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

var writeDestTable = function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(table, dataArray) {
    var params, count, i, data, request;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            console.log("start write...");
            params = {
              RequestItems: {}
            };

            params.RequestItems[table] = [];

            _context4.prev = 3;
            count = 0;
            _context4.t0 = regeneratorRuntime.keys(dataArray);

          case 6:
            if ((_context4.t1 = _context4.t0()).done) {
              _context4.next = 19;
              break;
            }

            i = _context4.t1.value;
            data = dataArray[i];
            request = {
              PutRequest: {
                Item: data
              }
            };

            params.RequestItems[table].push(request);
            count++;

            //batchWrite limit 25

            if (!(count >= 25)) {
              _context4.next = 17;
              break;
            }

            _context4.next = 15;
            return db.batchWrite(params);

          case 15:
            params.RequestItems[table] = [];
            count = 0;

          case 17:
            _context4.next = 6;
            break;

          case 19:
            _context4.next = 21;
            return db.batchWrite(params);

          case 21:
            return _context4.abrupt('return', _context4.sent);

          case 24:
            _context4.prev = 24;
            _context4.t2 = _context4['catch'](3);
            throw _context4.t2;

          case 27:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this, [[3, 24]]);
  }));

  return function writeDestTable(_x4, _x5) {
    return _ref4.apply(this, arguments);
  };
}();

var outputDestDataArray = function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(dataArray) {
    var destDataArray, i, data, destData;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            destDataArray = [];
            _context5.t0 = regeneratorRuntime.keys(dataArray);

          case 2:
            if ((_context5.t1 = _context5.t0()).done) {
              _context5.next = 11;
              break;
            }

            i = _context5.t1.value;
            data = dataArray[i];
            _context5.next = 7;
            return makeDestData(data);

          case 7:
            destData = _context5.sent;

            destDataArray.push(destData);
            _context5.next = 2;
            break;

          case 11:
            _context5.next = 13;
            return writeDestTable(DestTable, destDataArray);

          case 13:
            return _context5.abrupt('return', _context5.sent);

          case 14:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function outputDestDataArray(_x6) {
    return _ref5.apply(this, arguments);
  };
}();

var outputDestSingleData = function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(dataObj) {
    var destData, result;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;
            _context6.next = 3;
            return makeDestData(dataObj);

          case 3:
            destData = _context6.sent;
            _context6.next = 6;
            return db.post(DestTable, destData);

          case 6:
            result = _context6.sent;
            return _context6.abrupt('return', result);

          case 10:
            _context6.prev = 10;
            _context6.t0 = _context6['catch'](0);
            throw _context6.t0;

          case 13:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this, [[0, 10]]);
  }));

  return function outputDestSingleData(_x7) {
    return _ref6.apply(this, arguments);
  };
}();

var update = function () {
  var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(inputData, attr) {
    var start_time, dataObj, result;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            start_time = Date.now();
            _context7.prev = 1;
            _context7.next = 4;
            return getSourceData(inputData);

          case 4:
            dataObj = _context7.sent;
            _context7.next = 7;
            return outputDestData(dataObj);

          case 7:
            result = _context7.sent;

            console.log("-------");
            console.log("time usage: " + (Date.now() - start_time));
            return _context7.abrupt('return', result);

          case 13:
            _context7.prev = 13;
            _context7.t0 = _context7['catch'](1);
            throw _context7.t0;

          case 16:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this, [[1, 13]]);
  }));

  return function update(_x8, _x9) {
    return _ref7.apply(this, arguments);
  };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var db = require('./dynamodb.js');
var qrcode = require('./qrcode.js');
var s3 = require('./s3.js');
var utils = require('./utils.js');

var SourceTable = "Branches";
var DestTable = "BranchesB2C";

var data_counter = 0;
var db_query_counter = 0;

function getSourceTable() {
  return SourceTable;
}

function outputDestData(dataObj) {
  if (Array.isArray(dataObj)) {
    return outputDestDataArray(dataObj);
  } else {
    return outputDestSingleData(dataObj);
  }
}

function statistic() {
  //  console.log(Object.keys(restaurant_cache));
  //  console.log("data counter="+data_counter);
  //  console.log("db query counter="+db_query_counter);
}

exports.update = update;
exports.outputDestData = outputDestData;
exports.getSourceTable = getSourceTable;