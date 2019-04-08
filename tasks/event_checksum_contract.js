const compile = require('./compile');
const fs = require('fs');
const {from_current} = require('./misc');
const path = require('path');
const keccak256 = require('keccak256');
const signale = require('signale');

const event_checksum_contract = async () => {
    signale.info('Compiling to recover event bytecode ...');
    await compile();
    signale.success('Compiled');

    signale.info('Generating events_utility.sol...');
    const code_checksums =
        fs.readdirSync(from_current('./build/contracts'))
            .filter((name) => name.indexOf('Event_') === 0)
            .map((event) => [event, '0x' + keccak256(Buffer.from((require(path.join(from_current('./build/contracts'), event))).deployedBytecode.slice(2), 'hex')).toString('hex')]);

    const inner_condition = code_checksums.map((data) => {
        return `// ${data[0]}\n        (code == bytes32(${data[1]}))`
    }).join('\n        ||\n        ');


    const condition = `return (\n        ${inner_condition}\n        );`;

    const substitute = `/* ===
        */
        
        ${condition}
        
        /*
        === */`;

    const events_utility = fs.readFileSync(from_current('./contracts/events_utility.sol')).toString();

    const begin_idx = events_utility.indexOf('/* ===');
    let end_idx = events_utility.indexOf('=== */');

    if (begin_idx === -1 || end_idx === -1) {
        throw new Error('Cannot find replace pattern in events_utility.sol');
    }

    end_idx += 6;
    const file_begin = events_utility.slice(0, begin_idx);
    const file_end = events_utility.slice(end_idx);

    const new_content = `${file_begin}${substitute}${file_end}`;
    fs.writeFileSync(from_current('./contracts/events_utility.sol'), new_content);
    signale.success('Generated events_utility.sol');

    signale.info('Compiling events_utility.sol ...');
    await compile();
    signale.success('Compiled events_utility.sol');
};

module.exports = event_checksum_contract;

