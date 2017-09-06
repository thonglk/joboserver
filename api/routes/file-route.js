'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _services = require('../services');

var _internalError = require('../utils/internal-error');

var _internalError2 = _interopRequireDefault(_internalError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = module.exports = _express2.default.Router({ mergeParams: true });

router.route('/').get(function (req, res, next) {
  var url = req.query.url;

  _services.s3Services.s3Display(url).then(function (data) {
    var header = {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename=' + url.substr(url.lastIndexOf('/') + 1, url.length).replace('+', ' '),
      'File-Path': url
    };
    res.set(header);
    res.send(data);
  }).catch(function (err) {
    return next((0, _internalError2.default)(err));
  });
}).delete(function (req, res, next) {
  var url = req.query.url;

  _services.s3Services.remove(url).then(function (status) {
    return res.status(200).json(status);
  }).catch(function (err) {
    return next((0, _internalError2.default)(err));
  });
}).post(_services.uploadServices.files, function (req, res, next) {
  var files = req.files || [];
  var folder = 'files/' + new Date(Date.now()).toDateString();
  Promise.all(files.map(function (file) {
    return _services.s3Services.upload(folder, file);
  })).then(function (files) {
    return res.status(200).json(files);
  }).catch(function (err) {
    return res.status(500).json(err);
  });
});