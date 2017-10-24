var fs = require('fs');
var _ = require("underscore");

fs.readdirSync(__dirname).forEach((file) => {
    if (file !== 'index.js') {
        const moduleName = file.split('.')[0];
        module.exports[moduleName] = require(`./${file}`);
    }
});