'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_fs2.default.readdirSync(__dirname).forEach(function (file) {
  if (file !== 'index.js') {
    var moduleName = file.split('.')[0];
    exports[file.split('-')[0] + 'Services'] = require('./' + moduleName); // eslint-disable-line
  }
});