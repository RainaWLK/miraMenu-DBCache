'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var getBranch = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(branch_id) {
    var Branch_Table, restaurant_query, branchData;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            Branch_Table = "BranchesB2C";
            restaurant_query = false;

            if (branch_id.indexOf('s') < 0) {
              Branch_Table = "Restaurants";
              restaurant_query = true;
            }

            branchData = parent_cache[branch_id];

            console.log(branch_id + " checking..");
            data_counter++;

            if (!(branchData === undefined)) {
              _context.next = 24;
              break;
            }

            console.log("db query:" + branch_id);
            _context.prev = 8;
            _context.next = 11;
            return db.queryById(Branch_Table, branch_id);

          case 11:
            branchData = _context.sent;

            db_query_counter++;
            console.log("got " + branch_id);
            _context.next = 20;
            break;

          case 16:
            _context.prev = 16;
            _context.t0 = _context['catch'](8);

            console.log(branch_id + " not found");
            branchData = false;

          case 20:
            if (restaurant_query) {
              //fix data
              branchData.restaurant_id = branchData.id;
              branchData.restaurant_name = branchData.name;
              branchData.branch_name = branchData.name;
              delete branchData.name;
            }
            parent_cache[branch_id] = branchData;
            _context.next = 26;
            break;

          case 24:
            console.log(branch_id + " cache goted");
            cache_counter++;

          case 26:
            return _context.abrupt('return', branchData);

          case 27:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[8, 16]]);
  }));

  return function getBranch(_x) {
    return _ref.apply(this, arguments);
  };
}();

var getSourceData = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(table) {
    var menusDataArray, validMenusDataArray, promises, _loop, i, DataArray;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return db.scan(table);

          case 2:
            menusDataArray = _context2.sent;
            validMenusDataArray = [];
            promises = [];

            _loop = function _loop(i) {
              var menuItemData = menusDataArray[i];
              var promise = getBranch(menuItemData.id).then(function (branchData) {
                if (branchData) {
                  validMenusDataArray.push(menuItemData);
                } else {
                  invalidData.push(menuItemData);
                }
              });
              promises.push(promise);
            };

            for (i in menusDataArray) {
              _loop(i);
            }
            _context2.next = 9;
            return Promise.all(promises);

          case 9:
            DataArray = validMenusDataArray.map(function (menuItemData) {
              var branchData = parent_cache[menuItemData.id];

              return {
                "branch": branchData,
                "menus": menuItemData.menus,
                "items": menuItemData.items
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
    var result;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            result = data.branch;


            result.availability = result.availability === false ? false : true;

            return _context3.abrupt('return', result);

          case 3:
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

var writeDestTable = function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(table, dataArray) {
    var params, count, i, data, request, _i2, _data, _request;

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
            if (!(SourceTable == DestTable)) {
              _context4.next = 39;
              break;
            }

            _context4.t2 = regeneratorRuntime.keys(invalidData);

          case 23:
            if ((_context4.t3 = _context4.t2()).done) {
              _context4.next = 37;
              break;
            }

            _i2 = _context4.t3.value;
            _data = invalidData[_i2];
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
              _context4.next = 35;
              break;
            }

            _context4.next = 33;
            return db.batchWrite(params);

          case 33:
            params.RequestItems[table] = [];
            count = 0;

          case 35:
            _context4.next = 23;
            break;

          case 37:
            _context4.next = 39;
            return db.batchWrite(params);

          case 39:
            return _context4.abrupt('return');

          case 42:
            _context4.prev = 42;
            _context4.t4 = _context4['catch'](3);
            throw _context4.t4;

          case 45:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this, [[3, 42]]);
  }));

  return function writeDestTable(_x4, _x5) {
    return _ref4.apply(this, arguments);
  };
}();

var go = function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
    var start_time, dataArray, destDataArray, i, data, destData;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            start_time = Date.now();

            //backup first
            //await clone.go("BranchesBak", SourceTable);

            _context5.next = 3;
            return getSourceData(SourceTable);

          case 3:
            dataArray = _context5.sent;

            //console.log(dataArray);

            destDataArray = [];
            _context5.t0 = regeneratorRuntime.keys(dataArray);

          case 6:
            if ((_context5.t1 = _context5.t0()).done) {
              _context5.next = 20;
              break;
            }

            i = _context5.t1.value;
            data = dataArray[i];
            destData = null;

            if (!(SourceTable == DestTable)) {
              _context5.next = 16;
              break;
            }

            _context5.next = 13;
            return fixTable(data);

          case 13:
            destData = _context5.sent;
            _context5.next = 17;
            break;

          case 16:
            destData = makeDestData(data);

          case 17:
            destDataArray = destDataArray.concat(destData);
            _context5.next = 6;
            break;

          case 20:

            console.log(destDataArray);
            _context5.next = 23;
            return writeDestTable(DestTable, destDataArray);

          case 23:
            console.log("-------");
            console.log("time usage: " + (Date.now() - start_time));

            statistic();

            return _context5.abrupt('return', destDataArray);

          case 27:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function go() {
    return _ref5.apply(this, arguments);
  };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var db = require('./dynamodb.js');
var clone = require('./clone.js');
var utils = require('./utils.js');

var SourceTable = "Menus";
var DestTable = "ItemsB2C";

var parent_cache = {};
var invalidData = [];

var data_counter = 0;
var db_query_counter = 0;
var cache_counter = 0;

function makeDestData(dataSet) {
  var branchData = dataSet.branch;
  var menusData = dataSet.menus;
  var itemsData = dataSet.items;

  var result = [];
  for (var i in itemsData) {
    var itemData = itemsData[i];

    itemData.id = i;

    itemData.restaurant_id = branchData.restaurant_id;
    itemData.restaurant_name = branchData.restaurant_name;
    itemData.branch_id = branchData.id;
    itemData.branch_name = branchData.branch_name;

    itemData.availability = itemData.availability === false ? false : true;

    if (_typeof(branchData.i18n) === 'object') {
      if (itemData.i18n === undefined) {
        itemData.i18n = {};
      }

      for (var _i in branchData.i18n) {
        itemData.i18n[_i] = branchData.i18n[_i];
      }
    }
    result.push(itemData);
  }

  return result;
}

function statistic() {
  console.log(Object.keys(parent_cache));
  console.log("data counter=" + data_counter);
  console.log("db query counter=" + db_query_counter);
  console.log("cache counter=" + cache_counter);
  console.log("not existed counter=" + invalidData.length);
}

exports.go = go;