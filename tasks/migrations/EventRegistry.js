const { from_current } = require('../misc');

const {exec} = require('child_process');
const {Portalize} = require('portalize');

const EventRegistry = async () => {
    const current_dir = process.cwd();
    process.chdir(from_current(''));
    return new Promise((ok, ko) => {
        Portalize.get.setPortal(from_current('./portal'));
        Portalize.get.setModuleName('contracts');

        const config = Portalize.get.get('network.json', {module: 'network'});
        const admin_artifact = require('../../build/contracts/AdministrationBoardV0.json');
        const emr_artifact = require('../../build/contracts/EventManagersRegistryV0.json');
        exec(`${from_current('./node_modules/.bin/zos')} create EventRegistry --init initialize --args ${admin_artifact.networks[config.network_id].address},${emr_artifact.networks[config.network_id].address} --network ${process.env.T721_NETWORK}`,
            (err, stdout, stderr) => {
                if (err) {
                    console.error(stderr);
                    return ko(err);
                }
                console.log(stdout);
                process.chdir(current_dir);
                ok();
            });

    })
};

module.exports = EventRegistry;
