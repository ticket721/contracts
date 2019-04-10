const {Portalize} = require('portalize');
const {from_current} = require('../misc');

module.exports = async function deploy_requirements() {
    Portalize.get.setPortal(from_current('./portal'));
    Portalize.get.setModuleName('contracts');

    if (!Portalize.get.requires({
        action: 'add',
        file: 'AdministrationBoardV0.artifact.json',
        from: 'contracts'
    })) {
        throw new Error('Cannot find artifact for contract AdministrationBoard. Run deploy before simulation');
    }

    if (!Portalize.get.requires({
        action: 'add',
        file: 'T721V0.artifact.json',
        from: 'contracts'
    })) {
        throw new Error('Cannot find artifact for contract T721. Run deploy before simulation');
    }

};
