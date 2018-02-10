"use strict";

var writeTable = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(table, dataArray) {
    var params, count, i, data, request;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            console.log("start write...");
            params = {
              RequestItems: {}
            };

            params.RequestItems[table] = [];

            _context.prev = 3;
            count = 0;
            _context.t0 = regeneratorRuntime.keys(dataArray);

          case 6:
            if ((_context.t1 = _context.t0()).done) {
              _context.next = 19;
              break;
            }

            i = _context.t1.value;
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
              _context.next = 17;
              break;
            }

            _context.next = 15;
            return db.batchWrite(params);

          case 15:
            params.RequestItems[table] = [];
            count = 0;

          case 17:
            _context.next = 6;
            break;

          case 19:
            _context.next = 21;
            return db.batchWrite(params);

          case 21:
            return _context.abrupt("return", _context.sent);

          case 24:
            _context.prev = 24;
            _context.t2 = _context["catch"](3);
            throw _context.t2;

          case 27:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[3, 24]]);
  }));

  return function writeTable(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var go = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(destTable, sourceTable) {
    var start_time, dataArray, result;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            start_time = Date.now();

            //backup first

            _context2.next = 3;
            return db.createBackup(destTable);

          case 3:
            _context2.next = 5;
            return db.scan(sourceTable);

          case 5:
            dataArray = _context2.sent;
            _context2.next = 8;
            return writeTable(destTable, dataArray);

          case 8:
            result = _context2.sent;

            console.log("-------");
            console.log(result);
            console.log("time usage: " + (Date.now() - start_time));
            //statistic();

            return _context2.abrupt("return", result);

          case 13:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function go(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var db = require('./dynamodb.js');

function statistic() {}

exports.go = go;