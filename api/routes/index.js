'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = module.exports = _express2.default.Router({ mergeParams: true });

router.use('/image', require('./image-route'));
router.use('/video', require('./video-route'));
router.use('/file', require('./file-route'));

router.use('*', function (req, res) {
  res.status(404);
  res.send('NOT_FOUND');
  res.end();
});