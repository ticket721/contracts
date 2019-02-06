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
            networks: artifact.networks
        };

        let desc = undefined;
        if (reformat.networks[config.network_id]) {
            desc = `deployed ${artifact.contractName}`
        }

        Portalize.get.add(`${artifact.contractName}.artifact.json`, reformat, {desc});

    }
};

module.exports = artifacter;
