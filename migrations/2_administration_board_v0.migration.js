const { scripts, ConfigVariablesInitializer } = require('zos');
const { add, push, create } = scripts;

const {Portalize} = require('portalize');

async function deploy(options, net_config) {
    // Register v0 of MyContract in the zos project
    //add({ contractsData: [{ name: 'AdministrationBoardV0', alias: 'AdministrationBoard' }] });

    // Push implementation contracts to the network
    await push(options);

    // Create an instance of MyContract, setting initial value to 42
    await create(Object.assign({ contractAlias: 'AdministrationBoard', initMethod: 'initialize', initArgs: [
            net_config.contract_infos.AdministrationBoard.initial_member,
            51
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
            })
    }
};
