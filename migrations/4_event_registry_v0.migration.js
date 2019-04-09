const { scripts, ConfigVariablesInitializer } = require('zos');
const { add, push, create } = scripts;

const {Portalize} = require('portalize');

async function deploy(options, net_config) {

    const AdministrationBoard = artifacts.require('./AdministrationBoardV0');
    const EventManagersRegistry = artifacts.require('./EventManagersRegistryV0');

    //add({ contractsData: [{ name: 'EventRegistryV0', alias: 'EventRegistry' }] });

    await push(options);

    await create(Object.assign({ contractAlias: 'EventRegistry', initMethod: 'initialize', initArgs: [
            AdministrationBoard.address,
            EventManagersRegistry.address,
        ] }, options));
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
