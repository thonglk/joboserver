'use strict';

var _multer = require('multer');

var _multer2 = _interopRequireDefault(_multer);

var _settings = require('../settings');

var _settings2 = _interopRequireDefault(_settings);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function filename(req, file, cb) {
  cb(null, file.originalname);
}

function storage(_path) {
  return _multer2.default.diskStorage({
    destination: function destination(req, file, cb) {
      cb(null, '' + _settings2.default.fileUpload.dest + _path + '/');
    },
    filename: filename
  });
}

function imageFilter(req, file, cb) {
  if (!file.originalname.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only jpg|jpeg|png|gif image files are allowed! ' + file.originalname), false);
  }
  cb(null, true);
}

function fileFilter(req, file, cb) {
  if (!file.originalname.toLowerCase().match(/\.(zip|rar|doc|txt|jpg|jpeg|png|gif|pdf)$/)) {
    return cb(new Error('Only zip, rar, doc, txt, pdf files are allowed! ' + file.originalname), false);
  }
  cb(null, true);
}

function videoFilter(req, file, cb) {
  if (!file.originalname.toLowerCase().match(/\.(mp4|avi|3gp|mkv|mov|m4v|mpeg|wmv|3g2)$/)) {
    return cb(new Error('Only mp4|avi|3gp|mkv|mov|m4v|mpeg|wmv|3g2 video files are allowed! ' + file.originalname), false);
  }
  cb(null, true);
}

var videos = (0, _multer2.default)({
  storage: storage('videos'),
  limits: {
    fileSize: _settings2.default.fileUpload.size
  },
  fileFilter: videoFilter
}).any();

var images = (0, _multer2.default)({
  storage: storage('images'),
  limits: {
    fileSize: _settings2.default.fileUpload.size
  },
  fileFilter: imageFilter
}).any();

var files = (0, _multer2.default)({
  storage: storage('files'),
  limits: {
    fileSize: _settings2.default.fileUpload.size
  },
  fileFilter: fileFilter
}).any();

module.exports = { images: images, videos: videos, files: files };