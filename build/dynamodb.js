'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var queryDataById = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(tableName, id) {
        var params, dataArray, err;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        params = {
                            TableName: tableName,
                            KeyConditionExpression: "#id = :id",
                            ExpressionAttributeNames: {
                                "#id": "id"
                            },
                            ExpressionAttributeValues: {
                                ":id": id
                            },
                            ReturnConsumedCapacity: "TOTAL"
                        };
                        _context.prev = 1;
                        _context.next = 4;
                        return queryData(params);

                    case 4:
                        dataArray = _context.sent;

                        if (!(dataArray.length == 0)) {
                            _context.next = 9;
                            break;
                        }

                        err = new Error("not found");

                        err.statusCode = 404;
                        throw err;

                    case 9:
                        //debug
                        if (dataArray.length > 1) {
                            console.log('!!!! queryDataById issue !!!!!');
                        }
                        return _context.abrupt('return', dataArray[0]);

                    case 13:
                        _context.prev = 13;
                        _context.t0 = _context['catch'](1);
                        throw _context.t0;

                    case 16:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this, [[1, 13]]);
    }));

    return function queryDataById(_x, _x2) {
        return _ref.apply(this, arguments);
    };
}();

var queryData = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(params) {
        var data;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        _context2.prev = 0;
                        _context2.next = 3;
                        return docClient.query(params).promise();

                    case 3:
                        data = _context2.sent;
                        return _context2.abrupt('return', data.Items);

                    case 7:
                        _context2.prev = 7;
                        _context2.t0 = _context2['catch'](0);
                        throw _context2.t0;

                    case 10:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this, [[0, 7]]);
    }));

    return function queryData(_x3) {
        return _ref2.apply(this, arguments);
    };
}();

var scanDataByFilter = function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(params) {
        var data;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        _context3.prev = 0;
                        _context3.next = 3;
                        return docClient.scan(params).promise();

                    case 3:
                        data = _context3.sent;

                        console.log("Consumed Capacity:");
                        console.log(data.ConsumedCapacity);
                        return _context3.abrupt('return', data.Items);

                    case 9:
                        _context3.prev = 9;
                        _context3.t0 = _context3['catch'](0);

                        console.log(_context3.t0);
                        throw _context3.t0;

                    case 13:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this, [[0, 9]]);
    }));

    return function scanDataByFilter(_x4) {
        return _ref3.apply(this, arguments);
    };
}();

var scanData = function () {
    var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(tableName) {
        var data;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        _context4.prev = 0;
                        _context4.next = 3;
                        return docClient.scan({ TableName: tableName }).promise();

                    case 3:
                        data = _context4.sent;
                        return _context4.abrupt('return', data.Items);

                    case 7:
                        _context4.prev = 7;
                        _context4.t0 = _context4['catch'](0);

                        console.log(_context4.t0);
                        throw _context4.t0;

                    case 11:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, _callee4, this, [[0, 7]]);
    }));

    return function scanData(_x5) {
        return _ref4.apply(this, arguments);
    };
}();

var createBackup = function () {
    var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(table) {
        var today, timeStr, params, data;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
            while (1) {
                switch (_context5.prev = _context5.next) {
                    case 0:
                        today = new Date();
                        timeStr = today.toISOString().replace(/\:|\./g, "");
                        params = {
                            BackupName: table + '_' + timeStr, /* required */
                            TableName: table /* required */
                        };

                        console.log(params);

                        _context5.prev = 4;

                        console.log("Create backup from " + table + " ....");
                        _context5.next = 8;
                        return dynamodb.createBackup(params).promise();

                    case 8:
                        data = _context5.sent;

                        //let data = "";
                        console.log(data);
                        return _context5.abrupt('return', data);

                    case 13:
                        _context5.prev = 13;
                        _context5.t0 = _context5['catch'](4);

                        console.error(_context5.t0, _context5.t0.stack);
                        throw _context5.t0;

                    case 17:
                    case 'end':
                        return _context5.stop();
                }
            }
        }, _callee5, this, [[4, 13]]);
    }));

    return function createBackup(_x6) {
        return _ref5.apply(this, arguments);
    };
}();

var unittest = function () {
    var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
        var _this = this;

        var table, dateTime, timestamp, runTest, testData;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
            while (1) {
                switch (_context7.prev = _context7.next) {
                    case 0:
                        table = "photo_tmp";
                        dateTime = Date.now();
                        timestamp = Math.floor(dateTime);

                        runTest = function () {
                            var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(testCase) {
                                var output, queryoutput, putoutput, deleteoutput;
                                return regeneratorRuntime.wrap(function _callee6$(_context6) {
                                    while (1) {
                                        switch (_context6.prev = _context6.next) {
                                            case 0:
                                                _context6.next = 2;
                                                return postData(table, testCase);

                                            case 2:
                                                output = _context6.sent;

                                                console.log(output);
                                                _context6.next = 6;
                                                return queryDataById(table, testCase.id);

                                            case 6:
                                                queryoutput = _context6.sent;

                                                console.log(queryoutput);
                                                testCase["newtest"] = ">///<";
                                                _context6.next = 11;
                                                return putData(table, testCase);

                                            case 11:
                                                putoutput = _context6.sent;

                                                console.log(putoutput);
                                                _context6.next = 15;
                                                return queryDataById(table, testCase.id);

                                            case 15:
                                                queryoutput = _context6.sent;

                                                console.log(queryoutput);
                                                _context6.next = 19;
                                                return deleteData(table, testCase);

                                            case 19:
                                                deleteoutput = _context6.sent;

                                                console.log(deleteoutput);

                                            case 21:
                                            case 'end':
                                                return _context6.stop();
                                        }
                                    }
                                }, _callee6, _this);
                            }));

                            return function runTest(_x7) {
                                return _ref7.apply(this, arguments);
                            };
                        }();

                        _context7.prev = 4;
                        testData = {
                            "id": "r12345678-0s897661-1i" + timestamp,
                            "test1": "",
                            "test2": "1",
                            "test3": 0,
                            "test4": {
                                "test4-1": "1",
                                "test4-2": "",
                                "test4-3": 1
                            },
                            "test5": ["0", "", 0, "1", 1]
                        };
                        _context7.next = 8;
                        return runTest(testData);

                    case 8:
                        _context7.next = 13;
                        break;

                    case 10:
                        _context7.prev = 10;
                        _context7.t0 = _context7['catch'](4);

                        console.log(_context7.t0);

                    case 13:
                    case 'end':
                        return _context7.stop();
                }
            }
        }, _callee7, this, [[4, 10]]);
    }));

    return function unittest() {
        return _ref6.apply(this, arguments);
    };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var AWS = require('aws-sdk');
var _ = require('lodash');

AWS.config.update({
    region: "us-west-2"
});

var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

function queryDataByName(tableName, name) {
    var params = {
        TableName: tableName,
        KeyConditionExpression: "#n = :n",
        ExpressionAttributeNames: {
            "#n": "name"
        },
        ExpressionAttributeValues: {
            ":n": name
        }
    };

    return queryData(params);
}

function fixEmptyValue(data) {
    var outputData = {};
    for (var i in data) {

        if (data[i] === "") {
            continue;
        } else if (Array.isArray(data[i])) {
            data[i] = data[i].filter(function (elem) {
                return elem !== "";
            });
        } else if (_typeof(data[i]) == 'object') {
            data[i] = fixEmptyValue(data[i]);
        }

        outputData[i] = data[i];
    }

    return outputData;
}

function postData(tableName, data) {
    //check
    var inputData = fixEmptyValue(data);

    var params = {
        TableName: tableName,
        Item: inputData
    };
    console.log("==postData==");
    console.log(params);
    return new Promise(function (resolve, reject) {

        docClient.put(params).promise().then(function (result) {
            console.log("Added item:", JSON.stringify(result, null, 2));
            resolve(result);
        }).catch(function (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            reject(err);
        });
    });
}

function putData(tableName, data) {
    //check
    var inputData = fixEmptyValue(data);

    var updateAttr = {};
    var updateExp = "set ";
    var replacedName = {};
    var num = 0;
    for (var i in inputData) {
        if (i == 'id') continue;
        updateExp += "#b" + num + "=" + ":a" + num + ",";
        replacedName["#b" + num] = i;
        updateAttr[":a" + num] = inputData[i];
        num++;
    }
    updateExp = updateExp.slice(0, updateExp.length - 1); //remove last char

    var params = {
        TableName: tableName,
        Key: {
            "id": inputData.id
        },
        UpdateExpression: updateExp,
        ExpressionAttributeNames: replacedName,
        ExpressionAttributeValues: updateAttr,
        ReturnValues: "UPDATED_NEW"
    };

    return new Promise(function (resolve, reject) {

        docClient.update(params).promise().then(function (result) {
            console.log("UpdateItem succeeded:", JSON.stringify(inputData, null, 2));
            var outputData = result.Attributes;
            outputData.id = inputData.id;
            resolve(outputData);
        }).catch(function (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            reject(err);
        });
    });
}

function deleteData(tableName, data) {
    var params = {
        TableName: tableName,
        Key: {
            "id": data.id
            //ConditionExpression:"info.rating <= :val",
            //ExpressionAttributeValues: {
            //    ":val": 5.0
            //}
        } };

    return new Promise(function (resolve, reject) {
        docClient.delete(params).promise().then(function (result) {
            console.log("DeleteItem succeeded:", JSON.stringify(result, null, 2));
            resolve(result);
        }).catch(function (err) {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
            reject(err);
        });
    });
}

function batchGet(params) {
    return new Promise(function (resolve, reject) {
        params = fixEmptyValue(params);

        docClient.batchGet(params).promise().then(function (result) {
            console.log("Batch get succeeded:", JSON.stringify(result, null, 2));
            resolve(result);
        }).catch(function (err) {
            console.error("Batch get fail. Error JSON:", JSON.stringify(err, null, 2));
            reject(err);
        });
    });
}

function batchWrite(params) {
    return new Promise(function (resolve, reject) {
        params = fixEmptyValue(params);

        console.log(params);
        docClient.batchWrite(params).promise().then(function (result) {
            console.log("Batch write succeeded:", JSON.stringify(result, null, 2));
            resolve(result);
        }).catch(function (err) {
            console.error("Batch write fail. Error JSON:", JSON.stringify(err, null, 2));
            reject(err);
        });
    });
}

exports.queryById = queryDataById;
exports.queryDataByName = queryDataByName;
exports.scan = scanData;
exports.post = postData;
exports.put = putData;
exports.delete = deleteData;
exports.batchGet = batchGet;
exports.batchWrite = batchWrite;
exports.createBackup = createBackup;

exports.scanDataByFilter = scanDataByFilter;

//exports.fixEmptyValue = fixEmptyValue;

exports.unittest = unittest;