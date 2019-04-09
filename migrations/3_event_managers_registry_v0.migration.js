const { scripts, ConfigVariablesInitializer } = require('zos');
const { add, push, create } = scripts;

const {Portalize} = require('portalize');

async function deploy(options, net_config) {

    const AdministrationBoard = artifacts.require('./AdministrationBoardV0');
    console.log(AdministrationBoard.networks);

    //add({ contractsData: [{ name: 'EventManagersRegistryV0', alias: 'EventManagersRegistry' }] });

    await push(options);

    await create(Object.assign({ contractAlias: 'EventManagersRegistry', initMethod: 'initialize', initArgs: [
            AdministrationBoard.address
        ] }, options));
}

module.exports = async function(deployer, networkName) {
    if (networkName !== 'test' && networkName !== 'development') {

        Portalize.get.setPortal('../portal');
        Portalize.get.setModuleName('contracts');

        deployer

            .then(async () => {
                const config = Portalize.get.get('network.json', {module: 'network'});
                const {network, txParams} = await ConfigVariablesInitializer.initNetworkConfiguration({
                    network: networkName,
                    from: config.deployer
                });
                await deploy({network, txParams}, config);
                console.log('TWO');
            })
    }
};
