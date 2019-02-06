const {from_current} = require('./misc');
const {exec} = require('child_process');

const compile = async () => {
    const current_dir = process.cwd();
    process.chdir(from_current(''));

    return new Promise((ok, ko) => {
        exec(`${from_current('./node_modules/.bin/truffle')} compile`,
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

module.exports = compile;
