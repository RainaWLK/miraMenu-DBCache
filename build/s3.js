"use strict";

var getS3Obj = function () {
	var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(file) {
		var params, data;
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						params = {
							Bucket: BUCKET,
							Key: file
						};
						_context.prev = 1;
						_context.next = 4;
						return s3.getObject(params).promise();

					case 4:
						data = _context.sent;
						return _context.abrupt("return", data.Body);

					case 8:
						_context.prev = 8;
						_context.t0 = _context["catch"](1);
						throw _context.t0;

					case 11:
					case "end":
						return _context.stop();
				}
			}
		}, _callee, this, [[1, 8]]);
	}));

	return function getS3Obj(_x) {
		return _ref.apply(this, arguments);
	};
}();

var uploadToS3 = function () {
	var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(buf, filename, contentType) {
		var params, data;
		return regeneratorRuntime.wrap(function _callee2$(_context2) {
			while (1) {
				switch (_context2.prev = _context2.next) {
					case 0:
						params = {
							Bucket: BUCKET,
							ACL: "public-read",
							Key: filename,
							ContentType: contentType,
							Body: buf
						};
						_context2.prev = 1;
						_context2.next = 4;
						return s3.upload(params).promise();

					case 4:
						data = _context2.sent;

						console.log("Upload successed: " + data.Location);
						return _context2.abrupt("return", data);

					case 9:
						_context2.prev = 9;
						_context2.t0 = _context2["catch"](1);

						console.log('ERROR MSG: ', _context2.t0);
						throw _context2.t0;

					case 13:
					case "end":
						return _context2.stop();
				}
			}
		}, _callee2, this, [[1, 9]]);
	}));

	return function uploadToS3(_x2, _x3, _x4) {
		return _ref2.apply(this, arguments);
	};
}();

var deleteS3Obj = function () {
	var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(file) {
		var params, msg;
		return regeneratorRuntime.wrap(function _callee3$(_context3) {
			while (1) {
				switch (_context3.prev = _context3.next) {
					case 0:
						params = {
							Bucket: BUCKET,
							Key: file
						};

						console.log(params);
						_context3.prev = 2;
						_context3.next = 5;
						return s3.deleteObject(params).promise();

					case 5:
						msg = _context3.sent;

						console.log(msg);
						return _context3.abrupt("return", msg);

					case 10:
						_context3.prev = 10;
						_context3.t0 = _context3["catch"](2);

						console.log("deleteS3Obj catch");
						console.log(_context3.t0);
						throw _context3.t0;

					case 15:
					case "end":
						return _context3.stop();
				}
			}
		}, _callee3, this, [[2, 10]]);
	}));

	return function deleteS3Obj(_x5) {
		return _ref3.apply(this, arguments);
	};
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var AWS = require('aws-sdk');
var s3options = {
	useDualstack: true,
	region: "us-west-2"
};
var BUCKET = "meshphoto";
//if(process.env.NODE_ENV == 'development'){
//	BUCKET = "meshphoto-dev";
//}

var s3 = new AWS.S3(s3options);

function urlToPath(url) {
	var server = "https://" + BUCKET + ".s3.amazonaws.com/";
	var result = null;
	if (url.indexOf(server) >= 0) {
		result = url.substring(server.length);
	}
	console.log(result);
	return result;
}

function getPresignedURL(file, fileType) {
	var params = {
		Bucket: BUCKET,
		Key: file,
		ContentType: fileType,
		Expires: 300,
		ACL: 'public-read'
	};
	console.log("getPresignedURL=");
	console.log(params);
	return new Promise(function (resolve, reject) {
		s3.getSignedUrl('putObject', params, function (err, data) {
			console.log(err);
			console.log(data);

			if (err) {
				reject(err);
			}
			var signedRequest = data.toLowerCase();
			var p = data.indexOf('&x-amz-security-token=');
			if (p > 0) {
				signedRequest = signedRequest.substring(0, p);
			}

			var returnData = {
				"signedRequest": signedRequest,
				"url": "https://" + BUCKET + ".s3.amazonaws.com/" + file
			};
			resolve(returnData);
		});
	});
}

exports.urlToPath = urlToPath;
exports.getS3Obj = getS3Obj;
exports.uploadToS3 = uploadToS3;
exports.deleteS3Obj = deleteS3Obj;
exports.getPresignedURL = getPresignedURL;