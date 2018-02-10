let AWS = require('aws-sdk');
let s3options = {
	useDualstack: true,
	region: "us-west-2"
}
let BUCKET = "meshphoto";
//if(process.env.NODE_ENV == 'development'){
//	BUCKET = "meshphoto-dev";
//}

const s3 = new AWS.S3(s3options);

function urlToPath(url){
	let server = `https://${BUCKET}.s3.amazonaws.com/`;
	let result = null;
	if(url.indexOf(server) >= 0){
		result = url.substring(server.length);
	}
	console.log(result);
	return result;
}


async function getS3Obj(file){
	var params = {
		Bucket: BUCKET,
		Key: file
	};

	try {
		let data = await s3.getObject(params).promise();
		//res.setHeader("Content-Type", data.ContentType);
		return data.Body;
	}catch(err){
		throw err;
	}
}

async function uploadToS3(buf, filename, contentType){
	var params = {
		Bucket: BUCKET,
		ACL: "public-read",
		Key: filename,
		ContentType: contentType,
		Body: buf
	};

	try {
		let data = await s3.upload(params).promise();
		console.log("Upload successed: " + data.Location);
		return data;
	}
	catch(err){
		console.log('ERROR MSG: ', err);
		throw err;
	}

}

async function deleteS3Obj(file){
	var params = {
		Bucket: BUCKET,
		Key: file
	};
console.log(params);
	try {
		let msg = await s3.deleteObject(params).promise();
		console.log(msg);
		return msg;
	}catch(err){
		console.log("deleteS3Obj catch");
		console.log(err);
		throw err;
	}
}

function getPresignedURL(file, fileType){
	let params = {
		Bucket: BUCKET,
		Key: file,
		ContentType: fileType,
		Expires: 300,
		ACL: 'public-read'
	};
	console.log("getPresignedURL=");
	console.log(params);
	return new Promise((resolve, reject) => {
		s3.getSignedUrl('putObject', params, (err, data) => {
			console.log(err);
			console.log(data);

			if(err){
				reject(err);
			}
			let signedRequest = data.toLowerCase();
			let p = data.indexOf('&x-amz-security-token=');
			if(p > 0){
				signedRequest = signedRequest.substring(0, p);
			}

			let returnData = {
				"signedRequest": signedRequest,
				"url": `https://${BUCKET}.s3.amazonaws.com/${file}`
			}
			resolve(returnData);
		});
	})

}

exports.urlToPath = urlToPath;
exports.getS3Obj = getS3Obj;
exports.uploadToS3 = uploadToS3;
exports.deleteS3Obj = deleteS3Obj;
exports.getPresignedURL = getPresignedURL;
