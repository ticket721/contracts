const compat = require('../event_plugin_compatibility');
const { Portalize } = require('portalize');
const {from_current} = require('./misc');
const fs = require('fs');
const signale = require('signale');

module.exports = async function event_infos() {
    signale.info('Save event informations to portal');
    Portalize.get.setPortal(from_current('./portal'));
    Portalize.get.setModuleName('contracts');

    const events = fs.readdirSync(from_current('./contracts/events'));

    const data = {
        compatibility: compat,
        events
    };

    Portalize.get.add('event_infos.json', data);
    signale.success('Saved event informations to portal');
};
