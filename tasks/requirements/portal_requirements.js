const { from_current } = require('../misc');

const {Portalize} = require('portalize');

const portal_requirements = async () => {
    if (process.env.T721_NETWORK === 'test') return ;

    Portalize.get.setPortal(from_current('./portal'));
    Portalize.get.setModuleName('contracts');

    if (!Portalize.get.requires({
        action: 'add',
        desc: 'network ready',
        file: 'network.json',
        from: 'network'
    })) {
        throw new Error('No network configuration available. Be sure to run network tasks before');
    }
};

module.exports = portal_requirements;
