const shell = require('gulp-shell');

const Contract = shell.task('./node_modules/.bin/zos create Contract --init initialize --network local');
Contract.displayName = 'migration:Contract';

module.exports = Contract;
