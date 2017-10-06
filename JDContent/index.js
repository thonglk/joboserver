var fs = require('fs');

fs.readdirSync(__dirname).forEach((file) => {
    if (file !== 'index.js') {
        const moduleName = file.split('.')[0];
        module.exports[moduleName] = require(`./${file}`);
    }
});