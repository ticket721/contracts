const {exec} = require('child_process');
const {Portalize} = require('portalize');

const session = async () => {
    Portalize.get.setPortal('./portal');
    Portalize.get.setModuleName('contracts');

    const config = Portalize.get.get('network.json', {module: 'network'});

    return new Promise((ok, ko) => {
        exec(`./node_modules/.bin/zos session --network ${process.env.T721_NETWORK} --from ${config.deployer}`,
            (err, stdout, stderr) => {
                console.log(stdout);
                console.error(stderr);
                if (err) {
                    return ko(err);
                }
                ok();
            });
    })
};

module.exports = session;
