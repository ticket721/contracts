const signale = require('signale');
const {Portalize} = require('portalize');
const fs = require('fs');
const rimraf = require('rimraf');
const glob = require('glob');
const { from_current } = require('../misc');
const readline = require('readline');
const bip39 = require('bip39');
const hdkey = require('hdkey');
const utils = require('ethereumjs-util');

const apply_config = async () => {
    const config = Portalize.get.get('network.json', {module: 'network'});
    if (config.type !== process.env.T721_NETWORK) {
        throw new Error(`Expected config for ${process.env.T721_NETWORK} but got ${config.type}`);
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const mnemonic = await new Promise(resolve => rl.question('Enter your mnemonic:\n', ans => {
        rl.close();
        resolve(ans);
    }));

    if (!mnemonic) {
        throw new Error('No mnemonic input')
    }

    const seed = bip39.mnemonicToSeedSync(mnemonic);

    const root = hdkey.fromMasterSeed(seed);
    const derived = root.derive("m/44'/60'/0'/0/0");

    const address = `0x${utils.privateToAddress(derived.privateKey).toString('hex')}`;

    if (address.toLowerCase() !== config.deployer.toLowerCase()) {
        throw new Error(`${address} differs from configuration ${config.deployer}`);
    }

    const validation = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const result = await new Promise(resolve => validation.question(`Deploy using ${address} ? [y/N]\n`, ans => {
        validation.close();
        resolve(ans);
    }));

    if (result !== 'y' && result !== 'Y') {
        throw new Error('Operation aborted');
    }

    const raw_config = `
        const HDWalletProvider = require("truffle-hdwallet-provider");
    
        module.exports = {
            "networks": {
                "ropsten": {
                    provider: function() {
                        return new HDWalletProvider("${mnemonic}", "${config.url}", 0, 2)
                    },
                    network_id: ${config.network_id},
                    gas: ${config.network_gas},
                    skipDryRun: true
                }
            },
        
            "mocha": {},
        
            "compilers": {
                "solc": {
                }
            }
        }
    `;

    fs.writeFileSync(from_current('./truffle-config.js'), raw_config);
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

const ropsten_clean = async () => {
    await clean_build();
    await clean_config();
    await clean_zos_output();
    await clean_portal();
    await clean_events();
};

exports.ropsten_configure = apply_config;
exports.ropsten_clean = ropsten_clean;
