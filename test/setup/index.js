const fs = require('fs');
const path = require('path');
const url_parse = require('url-parse');
const glob = require('glob');
const {exec} = require('child_process');
const {Signale} = require('signale');

const from_current = (add_path) => path.join(path.resolve(path.join(__dirname, '../../')), add_path);

const signale_options = {
    disabled: false,
    interactive: false,
    stream: process.stdout,
    scope: 'test',
    types: {
        info: {
            badge: '[I]',
            color: 'blue',
            label: ''
        },
        success: {
            badge: '[+]',
            color: 'green',
            label: ''
        }
    }
};

const signale = new Signale(signale_options);

module.exports.NET = {
    name: process.env.T721_COVERAGE ? 'development' : 'test',
    id: null
};

const node_modules_path = () => {
    return './node_modules';
};

// Generate ganache snapshot ID => save current state of bc
const snapshot = () => {
    return new Promise((ok, ko) => {
        web3.currentProvider.send({
            method: "evm_snapshot",
            params: [],
            jsonrpc: "2.0",
            id: new Date().getTime()
        }, (error, res) => {
            if (error) {
                return ko(error);
            } else {
                ok(res.result);
            }
        })
    })
};

// Revert the state of the blockchain to previously saved state
const revert = (snap_id) => {
    return new Promise((ok, ko) => {
        web3.currentProvider.send({
            method: "evm_revert",
            params: [snap_id],
            jsonrpc: "2.0",
            id: new Date().getTime()
        }, (error, res) => {
            if (error) {
                return ko(error);
            } else {
                ok(res.result);
            }
        })
    })
};


// Configure zos session to use the test network
const session = async () => {
    const accounts = await web3.eth.getAccounts();

    return new Promise((ok, ko) => {
        signale.info('Running zos session ...');
        exec(`${node_modules_path()}/.bin/zos session --network ${module.exports.NET.name} --from ${accounts[9]}`, (err, stdout, stderr) => {
            if (err) {
                console.error(stderr);
                return ko(err);
            }
            signale.success('Ran zos session');
            ok();
        })
    });

};

// Push logics of the contracts to the network
const push = async () => {
    return new Promise((ok, ko) => {
        signale.info('Running zos push ...');
        exec(`${node_modules_path()}/.bin/zos push --network ${module.exports.NET.name}`, (err, stdout, stderr) => {
            if (err) {
                console.error(stderr);
                return ko(err);
            }
            signale.success('Ran zos push');
            ok();
        })
    });
};

// Remove the generated config files
const remove_config_update = async () => {
    signale.info('Cleaning up ...');
    const config = require('../../truffle-config.js');

    delete config.networks.test;

    const end = `module.exports = ${JSON.stringify(config, null, 4)}`;
    fs.writeFileSync('./truffle-config.js', end);

    const zos_out_files = glob.sync(`zos.*${module.exports.NET.id}.json`);

    for (const file of zos_out_files) {
        fs.unlinkSync(path.join(path.resolve(), file));
    }
    signale.success('Cleaned up');
};

// Update truffle configuration to add test network
const update_config = async () => {
    signale.info('Updating config ...');

    // If coverage is enable, solidity-coverage will generate the configuration file, we sould only copy it
    // Also check if no node_modules are present, this means this is the first tested file and that we should link the old directory
    if (process.env.T721_COVERAGE) {
        module.exports.NET.id = await web3.eth.net.getId();
        fs.copyFileSync('./truffle.js', './truffle-config.js');
        if (!fs.existsSync('./node_modules')) {
            fs.symlinkSync('../node_modules', './node_modules');
        }

        // If there is no coverage, the configuration contains no information about the network, and we need to fill it manually
    } else {
        const config = require('../../truffle-config.js');
        module.exports.NET.id = await web3.eth.net.getId();
        const url = new url_parse((await web3.currentProvider).host);

        config.networks = {
            ...config.networks,
            test: {
                host: url.hostname,
                port: url.port,
                network_id: module.exports.NET.id
            }
        };

        const end = `module.exports = ${JSON.stringify(config, null, 4)}`;
        fs.writeFileSync('./truffle-config.js', end);
    }
    signale.success('Updated config');
};

// Recover deployed instance from artifacts
const instance = async (contract, address) => {

    const artifact = (await artifacts.require(contract));
    if (!address) {
        const live = require(`../../build/contracts/${contract}.json`);
        return artifact.at(live.networks[module.exports.NET.id].address);
    } else {
        return artifact.at(address);
    }

};

const getAllEvents = () => {
    return fs.readdirSync(from_current('./build/contracts'))
        .filter(filename => filename.indexOf('Event_') === 0)
        .map(filename => [filename, require(path.join(from_current('./build/contracts'), filename))]);
};

module.exports.signale = signale;
module.exports.instance = instance;
module.exports.revert = revert;
module.exports.session = session;
module.exports.remove_config_update = remove_config_update;
module.exports.update_config = update_config;
module.exports.push = push;
module.exports.snapshot = snapshot;
module.exports.node_modules_path = node_modules_path;
module.exports.get_all_events = getAllEvents;
