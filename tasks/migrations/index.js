const {series} = require('gulp');

const Contract = require('./Contract');

module.exports = series(Contract);
