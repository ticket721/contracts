const {from_current} = require('../misc');
const {spawn} = require('child_process');

const migrations = async () => {
    const current_dir = process.cwd();
    process.chdir(from_current(''));

    return new Promise((ok, ko) => {
        const child = spawn(`${from_current('./node_modules/.bin/truffle')}`,  [`migrate`, `--network`, `${process.env.T721_NETWORK}`]);
        child.stdout.on('data', (data) => {
            process.stdout.write(data.toString());
        });
        child.stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
        child.on('exit', (code) => {
            if (code !== 0) {
                return ko();
            }
            process.chdir(current_dir);
            ok();
        })
    })
};

module.exports = migrations;

