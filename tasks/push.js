const shell = require('gulp-shell');

const push = shell.task(`./node_modules/.bin/zos push --network ${process.env.T721_NETWORK}`);
push.displayName = 'push';

module.exports = push;

