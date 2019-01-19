const fs = require('fs');
const path = require('path');
const url_parse = require('url-parse');
const glob = require('glob');
const {exec} = require('child_process');
const signale = require('signale');

const NET = 'test';
let NET_ID;

// Generate ganache snapshot ID => save current state of bc
const snapshot = () => {
    signale.info('Recovering state snapshot ...');
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
                signale.success('Recovered state snapshot id');
                ok(res.result);
            }
        })
    })
};

// Revert the state of the blockchain to previously saved state
const revert = (snap_id) => {
    signale.info('Reverting state ...');
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
                signale.success('Reverted state');
                ok(res.result);
            }
        })
    })
};


// Configure zos session to use the test network
const session = async () => {
    const coinbase = await web3.eth.getCoinbase();

    return new Promise((ok, ko) => {
        signale.info('Running zos session ...');
        exec(`./node_modules/.bin/zos session --network ${NET} --from ${coinbase}`, (err, stdout, stderr) => {
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
        exec(`./node_modules/.bin/zos push --network ${NET}`, (err, stdout, stderr) => {
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

    const zos_out_files = glob.sync(`zos.*${NET_ID}.json`);

    for (const file of zos_out_files) {
        fs.unlinkSync(path.join(path.resolve(), file));
    }
    signale.success('Cleaned up');
};

// Update truffle configuration to add test network
const update_config = async () => {
    signale.info('Updating config ...');
    const config = require('../../truffle-config.js');
    NET_ID = await web3.eth.net.getId();
    const url = new url_parse((await web3.currentProvider).host);

    config.networks = {
        ...config.networks,
        test: {
            host: url.hostname,
            port: url.port,
            network_id: NET_ID
        }
    };

    const end = `module.exports = ${JSON.stringify(config, null, 4)}`;
    fs.writeFileSync('./truffle-config.js', end);
    signale.success('Updated config');
};


module.exports.NET = NET;
module.exports.NET_ID = NET_ID;
module.exports.revert = revert;
module.exports.session = session;
module.exports.remove_config_update = remove_config_update;
module.exports.update_config = update_config;
module.exports.push = push;
module.exports.snapshot = snapshot;
