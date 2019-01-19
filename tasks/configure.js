const signale = require('signale');
const {local_configure} = require('./network/local');
const {test_configure} = require('./network/test');

const configure = async () => {
    signale.info('[network][configure]');
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
    signale.info('[network][configured]');
};

module.exports = configure;
