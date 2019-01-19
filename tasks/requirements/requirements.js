const fs = require('fs');

const requirements = async () => {
    // Check if Network is specified
    if (!process.env.T721_NETWORK) {
        throw new Error('Env argument T721_NETWORK is required');
    }

    // Check if portal is deployed
    if (process.env.T721_NETWORK !== 'test' && !fs.existsSync('./portal')) {
        throw new Error('Cannot find portal, directory has not been initialized');
    }

};

module.exports = requirements;
