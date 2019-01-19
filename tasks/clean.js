const signale = require('signale');
const {local_clean} = require('./network/local');

const clean = async () => {
    signale.info('[network][clean]');
    switch (process.env.T721_NETWORK) {
        case 'local':
            await local_clean();
            break ;
        default:
            throw new Error(`Unknown Network ${process.env.T721_NETWORK}`)
    }
    signale.info('[network][cleaned]');
};

module.exports = clean;

