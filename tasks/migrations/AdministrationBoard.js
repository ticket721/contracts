const {exec} = require('child_process');
const {Portalize} = require('portalize');

const AdministrationBoard = async () => {
    return new Promise((ok, ko) => {
        Portalize.get.setPortal('./portal');
        Portalize.get.setModuleName('contracts');

        const config = Portalize.get.get('network.json', {module: 'network'});
        exec(`./node_modules/.bin/zos create AdministrationBoard --init initialize --args ${config.contract_infos.AdministrationBoard.initial_member},51 --network ${process.env.T721_NETWORK}`,
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

module.exports = AdministrationBoard;
