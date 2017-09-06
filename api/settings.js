var path = require('path');

module.exports = {
  fileUpload: {
    size: '30M',
    dest: path.join(__dirname, '../uploads/')
  }
};
