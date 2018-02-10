'use strict';

//let data_counter = 0;
//let db_query_counter = 0;
//let cache_counter = 0;
//let not_exist_counter = 0;

var getSourceData = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(inputData) {
    var params, branchDataArray, DataArray;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            params = {
              TableName: update_branch.getSourceTable(),
              FilterExpression: "#a1.#a2 = :b",
              ExpressionAttributeNames: {
                "#a1": "branchControl",
                "#a2": "restaurant_id"
              },
              ExpressionAttributeValues: {
                ":b": inputData.id
              },
              ReturnConsumedCapacity: "TOTAL"
            };
            _context.next = 3;
            return db.scanDataByFilter(params);

          case 3:
            branchDataArray = _context.sent;

            console.log(branchDataArray);

            DataArray = branchDataArray.map(function (branchData) {
              return {
                "restaurant": inputData,
                "branch": branchData
              };
            });
            return _context.abrupt('return', DataArray);

          case 7:
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

var update = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(inputData, attr) {
    var start_time, dataArray, result;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            start_time = Date.now();
            _context2.next = 3;
            return getSourceData(inputData);

          case 3:
            dataArray = _context2.sent;

            console.log(dataArray);

            _context2.prev = 5;
            _context2.next = 8;
            return update_branch.outputDestData(dataArray);

          case 8:
            result = _context2.sent;


            console.log("-------");
            console.log("time usage: " + (Date.now() - start_time));
            return _context2.abrupt('return', result);

          case 14:
            _context2.prev = 14;
            _context2.t0 = _context2['catch'](5);
            throw _context2.t0;

          case 17:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[5, 14]]);
  }));

  return function update(_x2, _x3) {
    return _ref2.apply(this, arguments);
  };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var db = require('./dynamodb.js');
var update_branch = require('./update_branch.js');

function statistic() {
  //  console.log("data counter="+data_counter);
  //  console.log("db query counter="+db_query_counter);
  //  console.log("cache counter="+cache_counter);
  //  console.log("not existed counter="+not_exist_counter);
}

exports.update = update;