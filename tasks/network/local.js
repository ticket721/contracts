const signale = require('signale');
const {Portalize} = require('portalize');
const fs = require('fs');
const rimraf = require('rimraf');
const glob = require('glob');
const { from_current } = require('../misc');

const apply_config = async () => {
    const config = Portalize.get.get('network.json', {module: 'network'});
    if (config.type !== process.env.T721_NETWORK) {
        throw new Error(`Expected config for ${process.env.T721_NETWORK} but got ${config.type}`);
    }

    const truffle_config = require('../truffle-config');

    truffle_config.networks = {
        ...truffle_config.networks,
        [process.env.T721_NETWORK]: config
    };

    const end_config = `module.exports = ${JSON.stringify(truffle_config, null, 4)}`;

    fs.writeFileSync(from_current('./truffle-config.js'), end_config);
};

const clean_build = async () => {
    if (fs.existsSync(from_current('./build'))) {
        signale.info('truffle: remove build dir');
        rimraf.sync(from_current('./build'));
    }
};

const clean_config = async () => {
    if (fs.existsSync(from_current('./truffle-config.js'))) {
        signale.info('truffle: remove config');
        fs.unlinkSync(from_current('./truffle-config.js'));
    }
};

const clean_events = async () => {
    if (fs.existsSync(from_current('./contracts/events'))) {
        signale.info('truffle: remove events');
        rimraf.sync(from_current('./contracts/events'));
    }
};

const clean_zos_output = async () => {
    const matchings = glob.sync(from_current('') + '/zos.*.json');

    for (const match of matchings) {
        fs.unlinkSync(match);
    }

    if (fs.existsSync(from_current('.zos.session'))) {
        fs.unlinkSync(from_current('.zos.session'));
    }
};

const clean_portal = async () => {
    signale.info(`portalize: clean contracts !`);
    Portalize.get.setPortal(from_current('./portal'));
    Portalize.get.setModuleName('contracts');
    Portalize.get.clean();
};

const local_clean = async () => {
    await clean_build();
    await clean_config();
    await clean_zos_output();
    await clean_portal();
    await clean_events();
};

exports.local_configure = apply_config;
exports.local_clean = local_clean;
