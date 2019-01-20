const signale = require('signale');
const {local_configure} = require('./network/local');
const {test_configure} = require('./network/test');
const combiner = require('../events');

const configure = async () => {
    signale.info('[contracts][configure]');

    const {version} = require('../zos');
    switch (process.env.T721_NETWORK) {
        case 'local':
            await local_configure();
            await combiner(version, '0.5.0');
            break;
        case 'test':
            await test_configure();
            await combiner(version, '0.5.0');
            break;
        default:
            throw new Error(`Unknown Network ${process.env.T721_NETWORK}`)
    }
    signale.info('[contracts][configured]');
};

module.exports = configure;
