const signale = require('signale');
const {local_configure} = require('./network/local');
const {test_configure} = require('./network/test');
const event_checksum_contract = require('./event_checksum_contract');
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
        default:
            throw new Error(`Unknown Network ${process.env.T721_NETWORK}`)
    }
    await combiner(version, '0.5.0');
    await event_checksum_contract();
    signale.info('[contracts][configured]');
};

module.exports = configure;
