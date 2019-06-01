const signale = require('signale');
const {local_configure} = require('./network/local');
const {test_configure} = require('./network/test');
const {ropsten_configure} = require('./network/ropsten');
const combiner = require('../events');

const configure = async () => {
    signale.info('[contracts][configure]');

    const {version} = require('../zos');
    switch (process.env.T721_NETWORK) {
        case 'local':
            await local_configure();
            break;
        case 'test':
            await test_configure();
            break;
        case 'ropsten':
            await ropsten_configure();
            break;
        default:
            throw new Error(`Unknown Network ${process.env.T721_NETWORK}`)
    }
    await combiner(version, '0.5.0');
    signale.info('[contracts][configured]');
};

module.exports = configure;
