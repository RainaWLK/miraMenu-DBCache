'use strict';

var route = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(inputData, attr) {
    var result;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            result = void 0;
            _context.prev = 1;

            console.log(attr.table);
            _context.t0 = attr.table;
            _context.next = _context.t0 === 'Restaurants' ? 6 : _context.t0 === 'Branches' ? 10 : _context.t0 === 'Menus' ? 14 : 15;
            break;

          case 6:
            _context.next = 8;
            return update_restaurant.update(inputData, attr);

          case 8:
            result = _context.sent;
            return _context.abrupt('break', 15);

          case 10:
            _context.next = 12;
            return update_branch.update(inputData, attr);

          case 12:
            result = _context.sent;
            return _context.abrupt('break', 15);

          case 14:
            return _context.abrupt('break', 15);

          case 15:
            return _context.abrupt('return', result);

          case 18:
            _context.prev = 18;
            _context.t1 = _context['catch'](1);
            throw _context.t1;

          case 21:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[1, 18]]);
  }));

  return function route(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var tools = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    var b2cItemDataArray;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return item.go();

          case 2:
            b2cItemDataArray = _context2.sent;

          case 3:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function tools() {
    return _ref2.apply(this, arguments);
  };
}();

var main = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(sns) {
    var msg, msgAttrs;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            console.log("message:");
            msg = JSON.parse(sns.Message);

            console.log(msg);

            console.log("attribute:");
            msgAttrs = parseMessageAttribute(sns.MessageAttributes);

            console.log(msgAttrs);

            _context3.next = 8;
            return route(msg, msgAttrs);

          case 8:
            return _context3.abrupt('return', _context3.sent);

          case 9:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function main(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var restaurant = require('./restaurant.js');
var branch = require('./branch.js');
var item = require('./item.js');

var update_restaurant = require('./update_restaurant.js');
var update_branch = require('./update_branch.js');
//let clone = require('./clone.js');

function parseMessageAttribute(messageAttributes) {
  var result = {};

  for (var key in messageAttributes) {
    if (messageAttributes[key].Type === 'String') {
      //drop binary attribute
      result[key] = messageAttributes[key].Value;
    }
  }
  return result;
}

tools();
exports.main = main;