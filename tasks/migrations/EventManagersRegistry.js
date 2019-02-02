const {exec} = require('child_process');
const {Portalize} = require('portalize');

const EventManagersRegistry = async () => {
    return new Promise((ok, ko) => {
        Portalize.get.setPortal('./portal');
        Portalize.get.setModuleName('contracts');

        const config = Portalize.get.get('network.json', {module: 'network'});
        const admin_artifact = require('../../build/contracts/AdministrationBoardV0.json');
        exec(`./node_modules/.bin/zos create EventManagersRegistry --init initialize --args ${admin_artifact.networks[config.network_id].address} --network ${process.env.T721_NETWORK}`,
            (err, stdout, stderr) => {
                if (err) {
                    console.error(stderr);
                    return ko(err);
                }
                console.log(stdout);
                ok();
            });

    })
};

module.exports = EventManagersRegistry;
