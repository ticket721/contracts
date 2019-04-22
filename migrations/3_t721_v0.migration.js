const { scripts, ConfigVariablesInitializer } = require('zos');
const { add, push, create } = scripts;
const { from_current } = require('../tasks/misc');
const fs = require('fs');
const path = require('path');
const signale = require('signale');

const {Portalize} = require('portalize');

async function deploy(options, net_config) {

    const AdministrationBoard = artifacts.require('./AdministrationBoardV0');

    await push(options);

    const res = await create(Object.assign({ contractAlias: 'T721', initMethod: 'initialize', initArgs: [
            AdministrationBoard.address,
            'Ticket 721',
            't721',
            net_config.server
        ] }, options));

    const event_types = fs.readdirSync(from_current('./build/contracts'))
        .filter(filename => filename.indexOf('Event_') === 0)
        .map(filename => [filename, path.join(from_current('./build/contracts'), filename)]);

    for (const event of event_types) {
        const artifact = require(event[1]);
        const bytecode = artifact.deployedBytecode;
        const bytes = Buffer.from(bytecode.slice(2), 'hex');

        signale.info(`Registering Bytecode for ${event[0]} ...`);
        await res.methods.set_event_code(bytes, true).send({
            gas: 0xffffffff,
            from: net_config.contract_infos.AdministrationBoard.initial_member
        });
        signale.success(`Registered Bytecode for ${event[0]}`);
    }

}

module.exports = function(deployer, networkName) {
    if (networkName !== 'test' && networkName !== 'development') {

        Portalize.get.setPortal('../portal');
        Portalize.get.setModuleName('contracts');

        deployer.then(async () => {
            const config = Portalize.get.get('network.json', {module: 'network'});
            const {network, txParams} = await ConfigVariablesInitializer.initNetworkConfiguration({
                network: networkName,
                from: config.deployer
            });
            await deploy({network, txParams}, config);
        })
    }

};
