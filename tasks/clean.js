const signale = require('signale');
const {local_clean} = require('./network/local');
const {test_clean} = require('./network/test');

const clean = async () => {
    signale.info('[contracts][clean]');
    switch (process.env.T721_NETWORK) {
        case 'local':
            await local_clean();
            break ;
        case 'test':
            await test_clean();
            break ;
        default:
            throw new Error(`Unknown Network ${process.env.T721_NETWORK}`)
    }
    signale.info('[contracts][cleaned]');
};

module.exports = clean;

