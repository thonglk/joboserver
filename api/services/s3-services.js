'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unlink = unlink;
exports.upload = upload;
exports.remove = remove;
exports.download = download;
exports.s3Display = s3Display;
exports.display = display;

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _awsConfig = require('../aws-config');

var _awsConfig2 = _interopRequireDefault(_awsConfig);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_awsSdk2.default.config.update(_awsConfig2.default);

var s3 = new _awsSdk2.default.S3();

function unlink(path, file) {
  return new Promise(function (resolve, reject) {
    _fs2.default.unlink(path, function (err) {
      // console.log(file);
      if (err) reject(err);else resolve(file);
    });
  });
}

function readFile(path) {
  return new Promise(function (resolve, reject) {
    _fs2.default.readFile(path, function (err, data) {
      if (err) reject(err);else resolve(data);
    });
  });
}

function upload(folder, file) {
  return new Promise(function (resolve, reject) {
    console.log('[S3 Uploading] ->', file.path);
    var fileName = file.filename.replace(/.*?\//g, '');
    var key = folder ? folder + '/' + fileName : fileName;
    readFile(file.path).then(function (buffer) {
      var s3Params = {
        Bucket: _awsConfig2.default.Bucket,
        Key: key,
        Body: buffer,
        ContentType: file.mimetype
      };
      s3.putObject(s3Params, function (err) {
        if (err) reject(err);else {
          var path = file.path;
          var newfile = Object.assign(file, {
            location: 's3Amazone',
            path: 'https://' + _awsConfig2.default.Bucket + '.s3-ap-southeast-1.amazonaws.com/' + key.replace(/\s/g, '+')
          });
          unlink(path, newfile).then(function (file) {
            // console.log(file);
            resolve(file);
          }).catch(function (_err) {
            return reject(_err);
          });
        }
      });
    }).catch(function (err) {
      return reject(err);
    });
  });
}

function remove(path) {
  return new Promise(function (resolve, reject) {
    var fileName = path.replace('https://' + _awsConfig2.default.Bucket + '.s3-ap-southeast-1.amazonaws.com/', '');
    var s3Params = {
      Bucket: _awsConfig2.default.Bucket,
      Key: fileName
    };
    s3.deleteObject(s3Params, function (err) {
      if (err) reject(err);else resolve({ success: true });
    });
  });
}

function download(fileName) {
  var s3Params = {
    Bucket: _awsConfig2.default.Bucket,
    Key: fileName
  };
  return s3.getObject(s3Params, function (_err) {
    return console.log(_err);
  });
}

function s3Display(path) {
  return new Promise(function (resolve, reject) {
    var key = path.replace('https://' + _awsConfig2.default.Bucket + '.s3-ap-southeast-1.amazonaws.com/', '');
    var s3Params = {
      Bucket: _awsConfig2.default.Bucket,
      Key: key
    };
    return s3.getObject(s3Params, function (err, data) {
      if (err) reject(err);else resolve(data.Body);
    });
  });
}

function localDisplay(path) {
  return new Promise(function (resolve, reject) {
    _fs2.default.readFile(path, function (err, data) {
      if (err) reject(err);else resolve(data);
    });
  });
}

function display(file) {
  var location = file && file.location;
  var view = file.view + 1;
  if (location === 'local') {
    return localDisplay(file.path);
  }

  var key = file.path.replace('https://' + _awsConfig2.default.Bucket + '.s3-ap-southeast-1.amazonaws.com/', '');
  return s3Display(key);
}