const {series} = require('gulp');

const AdministrationBoard = require('./AdministrationBoard');
const T721 = require('./T721');
const EventManagersRegistry = require('./EventManagersRegistry');
const EventRegistry = require('./EventRegistry');

module.exports = series(AdministrationBoard, EventManagersRegistry, EventRegistry, T721);
