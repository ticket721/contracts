const fs = require('fs');

const apply_config = async () => {
    const truffle_config = require('../truffle-config');

    const end_config = `module.exports = ${JSON.stringify(truffle_config, null, 4)}`;

    fs.writeFileSync('./truffle-config.js', end_config);
};

exports.test_configure = apply_config;
