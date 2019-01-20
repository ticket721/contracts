const {exec} = require('child_process');

const T721 = async () => {
    return new Promise((ok, ko) => {

        exec(`./node_modules/.bin/zos create T721 --init initialize --args ticket721,T721 --network ${process.env.T721_NETWORK}`,
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

module.exports = T721;
