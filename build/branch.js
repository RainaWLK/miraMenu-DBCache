'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var getRestaurant = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(restaurant_id) {
    var restaurantData;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            restaurantData = restaurant_cache[restaurant_id];

            console.log(restaurant_id + " checking..");
            data_counter++;

            if (!(restaurantData === undefined)) {
              _context.next = 20;
              break;
            }

            console.log("db query:" + restaurant_id);
            _context.prev = 5;
            _context.next = 8;
            return db.queryById("Restaurants", restaurant_id);

          case 8:
            restaurantData = _context.sent;

            db_query_counter++;
            console.log("got " + restaurant_id);
            _context.next = 17;
            break;

          case 13:
            _context.prev = 13;
            _context.t0 = _context['catch'](5);

            console.log(restaurant_id + " not found");
            restaurantData = false;

          case 17:
            restaurant_cache[restaurant_id] = restaurantData;
            _context.next = 22;
            break;

          case 20:
            console.log(restaurant_id + " cache goted");
            cache_counter++;

          case 22:
            return _context.abrupt('return', restaurantData);

          case 23:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[5, 13]]);
  }));

  return function getRestaurant(_x) {
    return _ref.apply(this, arguments);
  };
}();

var getSourceData = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(table) {
    var branchDataArray, validBranchDataArray, promises, _loop, i, DataArray;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return db.scan(table);

          case 2:
            branchDataArray = _context2.sent;
            validBranchDataArray = [];
            promises = [];

            _loop = function _loop(i) {
              var branchData = branchDataArray[i];
              var promise = getRestaurant(branchData.branchControl.restaurant_id).then(function (restaurantData) {
                if (restaurantData) {
                  validBranchDataArray.push(branchData);
                } else {
                  invalidData.push(branchData);
                }
              });
              promises.push(promise);
            };

            for (i in branchDataArray) {
              _loop(i);
            }
            _context2.next = 9;
            return Promise.all(promises);

          case 9:
            DataArray = validBranchDataArray.map(function (branchData) {
              var restaurant_id = branchData.branchControl.restaurant_id;
              var restaurantData = restaurant_cache[restaurant_id];

              return {
                "restaurant": restaurantData,
                "branch": branchData
              };
            });
            return _context2.abrupt('return', DataArray);

          case 11:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function getSourceData(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var fixTable = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(data) {
    var result, idArray, path, url, s3path, qrcodeStr, s3result;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            result = data.branch;


            result.availability = result.availability === false ? false : true;

            //location
            if (result.address === undefined && _typeof(result.location) === 'object') {
              result.address = result.location.address;
            }
            if (result.tel === undefined && _typeof(result.location) === 'object') {
              result.tel = result.location.tel;
            }
            if (result.geolocation === undefined && _typeof(result.location) === 'object') {
              result.geolocation = {};
              result.geolocation.zipcode = result.location.zipcode;
            } else if (_typeof(result.geolocation) === 'object') {
              result.geolocation.zipcode = result.geolocation.zipcode ? result.geolocation.zipcode : 0;
            } else {
              result.geolocation = {
                zipcode: 0
              };
            }
            delete result.location;

            //qr code
            idArray = utils.parseID(result.id);
            path = 'restaurants/r' + idArray.r + '/branches/s' + idArray.s;
            url = 'https://mira.menu/' + path;
            s3path = path + '/qrcode/qrcode.svg';
            _context3.next = 12;
            return qrcode.createQRCode(url);

          case 12:
            qrcodeStr = _context3.sent;
            _context3.next = 15;
            return s3.uploadToS3(qrcodeStr, s3path, 'image/svg+xml');

          case 15:
            s3result = _context3.sent;

            console.log(s3result);
            result.qrcode = 'https://cdn.mira.menu/' + s3result.key;

            return _context3.abrupt('return', result);

          case 19:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function fixTable(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

var writeInfoDB = function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(data) {
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return db.postData("Branches", data);

          case 2:
            return _context4.abrupt('return', _context4.sent);

          case 3:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function writeInfoDB(_x4) {
    return _ref4.apply(this, arguments);
  };
}();

var writeDestTable = function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(table, dataArray) {
    var params, count, i, data, request, _i, _data, _request;

    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            console.log("start write...");
            params = {
              RequestItems: {}
            };

            params.RequestItems[table] = [];

            _context5.prev = 3;
            count = 0;
            _context5.t0 = regeneratorRuntime.keys(dataArray);

          case 6:
            if ((_context5.t1 = _context5.t0()).done) {
              _context5.next = 19;
              break;
            }

            i = _context5.t1.value;
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
              _context5.next = 17;
              break;
            }

            _context5.next = 15;
            return db.batchWrite(params);

          case 15:
            params.RequestItems[table] = [];
            count = 0;

          case 17:
            _context5.next = 6;
            break;

          case 19:
            _context5.next = 21;
            return db.batchWrite(params);

          case 21:
            if (!(SourceTable == DestTable)) {
              _context5.next = 39;
              break;
            }

            _context5.t2 = regeneratorRuntime.keys(invalidData);

          case 23:
            if ((_context5.t3 = _context5.t2()).done) {
              _context5.next = 37;
              break;
            }

            _i = _context5.t3.value;
            _data = invalidData[_i];
            _request = {
              DeleteRequest: {
                Key: {
                  "id": _data.id
                }
              }
            };

            params.RequestItems[table].push(_request);
            count++;

            console.log(params);
            //batchWrite limit 25

            if (!(count >= 25)) {
              _context5.next = 35;
              break;
            }

            _context5.next = 33;
            return db.batchWrite(params);

          case 33:
            params.RequestItems[table] = [];
            count = 0;

          case 35:
            _context5.next = 23;
            break;

          case 37:
            _context5.next = 39;
            return db.batchWrite(params);

          case 39:
            return _context5.abrupt('return');

          case 42:
            _context5.prev = 42;
            _context5.t4 = _context5['catch'](3);
            throw _context5.t4;

          case 45:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this, [[3, 42]]);
  }));

  return function writeDestTable(_x5, _x6) {
    return _ref5.apply(this, arguments);
  };
}();

var go = function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
    var start_time, dataArray, destDataArray, i, data, destData;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            start_time = Date.now();

            //backup first
            //await clone.go("BranchesBak", SourceTable);

            _context6.next = 3;
            return getSourceData(SourceTable);

          case 3:
            dataArray = _context6.sent;

            //console.log(dataArray);

            destDataArray = [];
            _context6.t0 = regeneratorRuntime.keys(dataArray);

          case 6:
            if ((_context6.t1 = _context6.t0()).done) {
              _context6.next = 20;
              break;
            }

            i = _context6.t1.value;
            data = dataArray[i];
            destData = null;

            if (!(SourceTable == DestTable)) {
              _context6.next = 16;
              break;
            }

            _context6.next = 13;
            return fixTable(data);

          case 13:
            destData = _context6.sent;
            _context6.next = 17;
            break;

          case 16:
            destData = makeDestData(data);

          case 17:
            destDataArray.push(destData);
            _context6.next = 6;
            break;

          case 20:
            _context6.next = 22;
            return writeDestTable(DestTable, destDataArray);

          case 22:
            console.log("-------");
            console.log("time usage: " + (Date.now() - start_time));

            statistic();

            return _context6.abrupt('return', destDataArray);

          case 26:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function go() {
    return _ref6.apply(this, arguments);
  };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var db = require('./dynamodb.js');
var clone = require('./clone.js');
var qrcode = require('./qrcode.js');
var s3 = require('./s3.js');
var utils = require('./utils.js');

var SourceTable = "Branches";
var DestTable = "Branches";

var restaurant_cache = {};
var invalidData = [];

var data_counter = 0;
var db_query_counter = 0;
var cache_counter = 0;

function makeDestData(data) {
  var restaurantData = data.restaurant;

  var result = data.branch;
  result.restaurant_id = restaurantData.id;
  result.restaurant_name = restaurantData.name;
  result.branch_name = result.name;
  delete result.name;

  result.availability = result.availability === false ? false : true;

  //location
  if (result.address === undefined && _typeof(result.location) === 'object') {
    result.address = result.location.address;
  }
  if (result.tel === undefined && _typeof(result.location) === 'object') {
    result.tel = result.location.tel;
  }
  if (result.geolocation === undefined && _typeof(result.location) === 'object') {
    result.geolocation = {};
    result.geolocation.zipcode = result.location.zipcode;
  } else if (_typeof(result.geolocation) === 'object') {
    result.geolocation.zipcode = result.geolocation.zipcode ? result.geolocation.zipcode : 0;
  } else {
    result.geolocation = {
      zipcode: 0
    };
  }
  delete result.location;

  if (_typeof(restaurantData.i18n) === 'object') {
    if (result.i18n === undefined) {
      result.i18n = {};
    }

    for (var i in restaurantData.i18n) {
      result.i18n[i] = restaurantData.i18n[i];
    }
  }

  return result;
}

function statistic() {
  console.log(Object.keys(restaurant_cache));
  console.log("data counter=" + data_counter);
  console.log("db query counter=" + db_query_counter);
  console.log("cache counter=" + cache_counter);
  console.log("not existed counter=" + invalidData.length);
}

exports.go = go;