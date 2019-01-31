const fs = require('fs');

module.exports = {
    port: 7545,
    testCommand: 'truffle test',
    skipFiles: [
        ...fs.readdirSync('./contracts/events').map(file => 'events/' + file),
        'marketers/MarketerTester.sol',
        'approvers/ApproverTester.sol',
        'MarketerInterface.sol',
        'ApproverInterface.sol',
        'MinterInterface.sol',
        'EventInterface.sol'
    ]
};
