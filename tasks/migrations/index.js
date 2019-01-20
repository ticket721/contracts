const {series} = require('gulp');

const AdministrationBoard = require('./AdministrationBoard');
const T721 = require('./T721');

module.exports = series(AdministrationBoard, T721);
