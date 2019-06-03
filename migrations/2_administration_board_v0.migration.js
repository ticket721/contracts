const { scripts, ConfigVariablesInitializer } = require('zos');
const { add, push, create } = scripts;
const {from_current} = require('../tasks/misc');
const fs = require('fs');

const {Portalize} = require('portalize');

async function deploy(options, net_config) {
    // Register v0 of MyContract in the zos project
    //add({ contractsData: [{ name: 'AdministrationBoardV0', alias: 'AdministrationBoard' }] });

    // Push implementation contracts to the network
    await push(options);

    // Create an instance of MyContract, setting initial value to 42
    const result = await create(Object.assign({ contractAlias: 'AdministrationBoard', initMethod: 'initialize', initArgs: [
            net_config.contract_infos.AdministrationBoard.initial_member,
            51
        ] }, options));

    const current_block = await web3.eth.getBlockNumber();

    Portalize.get.add(`AdministrationBoardV0.height.json`, {height: current_block - 1 > 0 ? current_block - 1 : 0});

    const raw_artifact = require('../build/contracts/AdministrationBoardV0');

    raw_artifact.networks[net_config.network_id] = {
        "links": {},
        "events": {},
        "address": result.address,
        "updated_at": Date.now()
    };

   fs.writeFileSync(from_current('./build/contracts/AdministrationBoardV0.json'), JSON.stringify(raw_artifact, null, 4)) ;

}

module.exports = async function(deployer, networkName) {
    if (networkName !== 'test' && networkName !== 'development') {

        Portalize.get.setPortal('../portal');
        Portalize.get.setModuleName('contracts');

        await deployer
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
