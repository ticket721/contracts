const { from_current } = require('./misc');

const fs = require('fs');
const path = require('path');
const {Portalize} = require('portalize');

const artifacter = async () => {
    const contracts_dir = from_current('build/contracts');
    const artifacts = fs.readdirSync(contracts_dir);

    Portalize.get.setPortal(from_current('./portal'));
    Portalize.get.setModuleName('contracts');

    const config = Portalize.get.get('network.json', {module: 'network'});

    for (const artifact_file of artifacts) {
        const artifact = require(path.join(contracts_dir, artifact_file));
        const reformat = {
            name: artifact.contractName,
            abi: artifact.abi,
            bin: artifact.bytecode,
            runtimeBin: artifact.deployedBytecode,
            networks: artifact.networks,
            source: artifact,
            source_name: artifact_file
        };

        let desc = undefined;
        if (reformat.networks[config.network_id]) {
            desc = `deployed ${artifact.contractName}`
        }

        Portalize.get.add(`${artifact.contractName}.artifact.json`, reformat, {desc});

    }

    const config_files = fs.readdirSync(from_current('.'));

    const zos_data = [

    ];

    for (const file of config_files) {
        if (file.match(/zos\..+\.json/)) {
            const content = JSON.parse(fs.readFileSync(from_current(`/${file}`)).toString());
            zos_data.push({
                content,
                name: file
            })
        }
    }

    Portalize.get.add(`zos.artifact.json`, zos_data);

    if (process.env.T721_NETWORK === 'ropsten') {
        fs.unlinkSync(from_current('truffle-config.js'));
    }

};

module.exports = artifacter;
