const {series} = require('gulp');

const artifacter = require('./tasks/artifacter');
const clean = require('./tasks/clean');
const compile = require('./tasks/compile');
const push = require('./tasks/push');
const configure = require('./tasks/configure');
const {requirements, portal_requirements, deploy_requirements} = require('./tasks/requirements');
const migrations = require('./tasks/migrations');
const session = require('./tasks/session');
const {simulation} = require('./tasks/simulation');

exports['contracts:configure'] = series(requirements, portal_requirements, configure);
exports['contracts:compile'] = series(requirements, portal_requirements, compile);
exports['contracts:push'] = series(requirements, portal_requirements, push);
exports['contracts:deploy'] = series(requirements, portal_requirements, migrations, artifacter);
exports['contracts:clean'] = series(requirements, clean);
exports['contracts:simulation'] = series(requirements, portal_requirements, deploy_requirements, simulation);
