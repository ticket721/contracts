const { from_current } = require('../misc');

const {exec} = require('child_process');
const {Portalize} = require('portalize');

const T721 = async () => {
    const current_dir = process.cwd();
    process.chdir(from_current(''));
    return new Promise((ok, ko) => {
        Portalize.get.setPortal(from_current('./portal'));
        Portalize.get.setModuleName('contracts');

        const config = Portalize.get.get('network.json', {module: 'network'});
        const er_artifact = require('../../build/contracts/EventRegistryV0.json');
        exec(`${from_current('./node_modules/.bin/zos')} create T721 --init initialize --args ${er_artifact.networks[config.network_id].address},ticket721,T721 --network ${process.env.T721_NETWORK}`,
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

module.exports = T721;
