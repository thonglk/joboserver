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
      'Content-Type': 'video/ogg',
      'Content-Disposition': 'inline; filename=' + url.substr(url.lastIndexOf('/') + 1, url.length).replace('+', ' '),
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
}).post(_services.uploadServices.videos, function (req, res, next) {
  var videos = req.files || [];
  var folder = 'videos/' + new Date(Date.now()).toDateString();
  Promise.all(videos.map(function (video) {
    return _services.s3Services.upload(folder, video);
  })).then(function (videos) {
    return res.status(200).json(videos);
  }).catch(function (err) {
    return res.status(500).json(err);
  });
});