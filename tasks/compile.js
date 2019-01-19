const shell = require('gulp-shell');

const compile = shell.task('./node_modules/.bin/truffle compile');
compile.displayName = 'compile';

module.exports = compile;
