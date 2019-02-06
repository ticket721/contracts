const { from_current } = require('./misc');

const {exec} = require('child_process');
const {Portalize} = require('portalize');

const session = async () => {
    const current_dir = process.cwd();
    process.chdir(from_current(''));
    Portalize.get.setPortal(from_current('./portal'));
    Portalize.get.setModuleName('contracts');

    const config = Portalize.get.get('network.json', {module: 'network'});

    return new Promise((ok, ko) => {
        exec(`${from_current('./node_modules/.bin/zos')} session --network ${process.env.T721_NETWORK} --from ${config.deployer}`,
            (err, stdout, stderr) => {
                console.log(stdout);
                console.error(stderr);
                if (err) {
                    return ko(err);
                }
                process.chdir(current_dir);
                ok();
            });
    })
};

module.exports = session;
