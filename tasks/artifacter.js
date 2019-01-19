const fs = require('fs');
const path = require('path');
const {Portalize} = require('portalize');

const artifacter = async () => {
    const contracts_dir = path.join(path.resolve('.'), 'build/contracts');
    const artifacts = fs.readdirSync(contracts_dir);

    for (const artifact_file of artifacts) {
        const artifact = require(path.join(contracts_dir, artifact_file));
        const reformat = {
            name: artifact.contractName,
            abi: artifact.abi,
            bin: artifact.bytecode,
            runtimeBin: artifact.deployedBytecode,
            networks: artifact.networks
        };

        Portalize.get.add(`${artifact.contractName}.artifact.json`, reformat, {desc: `deployed ${artifact.contractName}`});

    }
};

module.exports = artifacter;
