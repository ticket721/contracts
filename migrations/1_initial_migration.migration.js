const Migrations = artifacts.require("./Migrations.sol");

module.exports = async function(deployer, network) {
    if (network !== 'test' && network !== 'development') {
        deployer.deploy(Migrations);
    }
};
