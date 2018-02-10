'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

//let data_counter = 0;
//let db_query_counter = 0;
//let cache_counter = 0;
//let not_exist_counter = 0;

var getSourceData = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(table) {
    var sourceDataArray;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return db.scan(table);

          case 2:
            sourceDataArray = _context.sent;
            return _context.abrupt('return', sourceDataArray);

          case 4:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getSourceData(_x) {
    return _ref.apply(this, arguments);
  };
}();

var writeInfoDB = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(data) {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return db.postData("Branches", data);

          case 2:
            return _context2.abrupt('return', _context2.sent);

          case 3:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function writeInfoDB(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var writeDestTable = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(table, dataArray) {
    var params, count, i, data, request;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            console.log("start write...");
            params = {
              RequestItems: {}
            };

            params.RequestItems[table] = [];

            _context3.prev = 3;
            count = 0;
            _context3.t0 = regeneratorRuntime.keys(dataArray);

          case 6:
            if ((_context3.t1 = _context3.t0()).done) {
              _context3.next = 19;
              break;
            }

            i = _context3.t1.value;
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
              _context3.next = 17;
              break;
            }

            _context3.next = 15;
            return db.batchWrite(params);

          case 15:
            params.RequestItems[table] = [];
            count = 0;

          case 17:
            _context3.next = 6;
            break;

          case 19:
            _context3.next = 21;
            return db.batchWrite(params);

          case 21:
            return _context3.abrupt('return', _context3.sent);

          case 24:
            _context3.prev = 24;
            _context3.t2 = _context3['catch'](3);
            throw _context3.t2;

          case 27:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this, [[3, 24]]);
  }));

  return function writeDestTable(_x3, _x4) {
    return _ref3.apply(this, arguments);
  };
}();

var go = function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
    var start_time, dataArray, destData;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            start_time = Date.now();

            //backup first

            _context4.next = 3;
            return clone.go("RestaurantsBak", SourceTable);

          case 3:
            _context4.next = 5;
            return getSourceData("Restaurants");

          case 5:
            dataArray = _context4.sent;

            //console.log(dataArray);

            destData = dataArray.map(function (data) {
              if (SourceTable == DestTable) {
                return fixTable(data);
              } else {
                return makeDestData(data);
              }
            });


            console.log(destData);
            _context4.next = 10;
            return writeDestTable(DestTable, destData);

          case 10:
            console.log("-------");
            console.log("time usage: " + (Date.now() - start_time));

            statistic();

            return _context4.abrupt('return', B2CData);

          case 14:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function go() {
    return _ref4.apply(this, arguments);
  };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var db = require('./dynamodb.js');
var clone = require('./clone.js');

var SourceTable = "Restaurants";
var DestTable = "RestaurantsB2C";

function makeDestData(data) {
  var result = data;

  //location
  if (result.address === undefined && _typeof(result.location) === 'object') {
    result.address = result.location.address;
  }
  if (result.tel === undefined && _typeof(result.location) === 'object') {
    result.tel = result.location.tel;
  }
  if (result.geolocation === undefined && _typeof(result.location) === 'object') {
    result.geolocation = {};
    result.geolocation.zipcode = result.location.zipcode ? result.location.zipcode : "0";
  } else if (_typeof(result.geolocation) === 'object') {
    result.geolocation.zipcode = result.geolocation.zipcode ? result.geolocation.zipcode : "0";
  } else {
    result.geolocation.zipcode = "0";
  }
  delete result.location;

  return result;
}

function statistic() {
  //  console.log("data counter="+data_counter);
  //  console.log("db query counter="+db_query_counter);
  //  console.log("cache counter="+cache_counter);
  //  console.log("not existed counter="+not_exist_counter);
}

exports.go = go;