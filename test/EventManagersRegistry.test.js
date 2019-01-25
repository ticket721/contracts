const {exec} = require('child_process');
const {snapshot, update_config, session, revert, NET, push, remove_config_update, instance, node_modules_path, signale} = require('./setup');

const chai = require('chai');
const chaiProm = require('chai-as-promised');
require('truffle-test-utils').init();

chai.use(chaiProm);

const expect = chai.expect;

const ab_contract_name = 'AdministrationBoardV0';
const emr_contract_name = 'EventManagersRegistryV0';

const ZERO = '0x0000000000000000000000000000000000000000';

let accounts = [];

const createAdministrationBoard = async (percent = 51) => {
    signale.info('Creating AdministrationBoard proxy ...');
    const accounts = await web3.eth.getAccounts();
    return new Promise((ok, ko) => {
        exec(`${node_modules_path()}/.bin/zos create AdministrationBoard --init initialize --args ${accounts[0]},${percent} --network ${NET.name}`, (err, stdout, stderr) => {
            if (err) {
                console.error(stderr);
                return ko(err);
            }
            signale.success('Created AdministrationBoard proxy');
            ok();
        })
    })
};

const createEventManagersRegistry = async () => {
    signale.info('Creating EventManagersRegistry proxy ...');
    const AB = await instance(ab_contract_name);
    return new Promise((ok, ko) => {
        exec(`${node_modules_path()}/.bin/zos create EventManagersRegistry --init initialize --args ${AB.address} --network ${NET.name}`, (err, stdout, stderr) => {
            if (err) {
                console.error(stderr);
                return ko(err);
            }
            signale.success('Created EventManagersRegistry proxy');
            ok();
        })
    })
};

const addMembers = async () => {
    signale.info('Adding initial Board Members ...');
    const accounts = await web3.eth.getAccounts();
    const AB = await instance(ab_contract_name);

    await AB.addMember(accounts[1]);
    await AB.addMember(accounts[2]);
    await AB.addMember(accounts[3]);
    await AB.addMember(accounts[4]);

    await AB.voteAdd(accounts[1], true);

    await AB.voteAdd(accounts[2], true);
    await AB.voteAdd(accounts[2], true, {from: accounts[1]});

    await AB.voteAdd(accounts[3], true);
    await AB.voteAdd(accounts[3], true, {from: accounts[1]});

    await AB.voteAdd(accounts[4], true);
    await AB.voteAdd(accounts[4], true, {from: accounts[1]});
    await AB.voteAdd(accounts[4], true, {from: accounts[2]});

    if (((await AB.isMember(accounts[1])) === false) ||
        ((await AB.isMember(accounts[2])) === false) ||
        ((await AB.isMember(accounts[3])) === false) ||
        ((await AB.isMember(accounts[4])) === false)) {
        throw new Error('Z One Two Three and Four should be members now');
    }
    signale.success('Added initial Board Members: Z One Two Three Four');
};

const create = async () => {
    await createAdministrationBoard();
    await createEventManagersRegistry();
    await addMembers();
};

contract('EventManagersRegistry', () => {

    before(async () => {
        await update_config();
        await session();
        await push();
        await create();
        this.snap_id = await snapshot();
        accounts = await web3.eth.getAccounts();
    });

    after(async () => {
        await remove_config_update()
    });

    beforeEach(async () => {
        const status = await revert(this.snap_id);
        expect(status).to.be.true;
        this.snap_id = await snapshot();
    });

    describe('[addManager] [getManagerByIndex isManager getManagerCount]', () => {

        it('[getManagerByIndex 1] [revert]', async () => {

            const EMR = await instance(emr_contract_name);

            return expect(EMR.getManagerByIndex(1)).to.eventually.be.rejected;

        });

        it('[addManager Z from Five] [revert]', async () => {

            const EMR = await instance(emr_contract_name);

            return expect(EMR.addManager(accounts[0], {from: accounts[5]})).to.eventually.be.rejected;

        });

        it(`[addManager ${ZERO} from Z] [revert]`, async () => {

            const EMR = await instance(emr_contract_name);

            return expect(EMR.addManager(ZERO)).to.eventually.be.rejected;

        });

        it(`[addManager Z from Z] [isManager Z == true] [getManagerCount == 1] [getManagerByIndex 0 == Z]`, async () => {

            const EMR = await instance(emr_contract_name);

            const res = await EMR.addManager(accounts[0]);
            assert.web3Event(res, {
                event: 'Manager',
                args: {
                    _manager: accounts[0],
                    _adder: accounts[0],

                    0: accounts[0],
                    1: accounts[0],

                    __length__: 2
                }
            }, 'The event is emitted');

            await expect(EMR.isManager(accounts[0])).to.eventually.be.true;
            expect((await EMR.getManagerCount()).toNumber()).to.equal(1);
            return expect(EMR.getManagerByIndex(0)).to.eventually.equal(accounts[0]);

        });

        it(`[addManager Z from Z] [addManager Z from Z] [revert]`, async () => {

            const EMR = await instance(emr_contract_name);

            await EMR.addManager(accounts[0]);
            return expect(EMR.addManager(accounts[0])).to.eventually.be.rejected;

        });

        it(`[addManager Z from Z] [addManager One from Z] [getManagerByIndex 1 == One]`, async () => {

            const EMR = await instance(emr_contract_name);

            await EMR.addManager(accounts[0]);
            await EMR.addManager(accounts[1]);
            return expect(EMR.getManagerByIndex(1)).to.eventually.equal(accounts[1]);

        });

    });

    describe('[removeManager] [addManager isManager getManagerCount getManagerByIndex]', () => {

        it(`[removeManager ${ZERO} from Z] [revert]`, async () => {

            const EMR = await instance(emr_contract_name);

            return expect(EMR.removeManager(ZERO)).to.eventually.be.rejected;
        });

        it(`[removeManager Z from Five] [revert]`, async () => {

            const EMR = await instance(emr_contract_name);

            return expect(EMR.removeManager(accounts[0], {from: accounts[5]})).to.eventually.be.rejected;
        });

        it(`[removeManager Five from Z] [revert]`, async () => {

            const EMR = await instance(emr_contract_name);

            return expect(EMR.removeManager(accounts[5])).to.eventually.be.rejected;
        });

        it(`[addManager Z from Z] [removeManager Z from Z] [revert]`, async () => {

            const EMR = await instance(emr_contract_name);

            await EMR.addManager(accounts[0]);
            return expect(EMR.removeManager(accounts[0])).to.eventually.be.rejected;
        });

        it(`[addManager One from Z] [removeManager One from Z] [isManager One == false] [getManagerCount == 0]`, async () => {

            const EMR = await instance(emr_contract_name);

            await EMR.addManager(accounts[1]);
            const res = await EMR.removeManager(accounts[1]);
            assert.web3Event(res, {
                event: 'RemovedManager',
                args: {
                    _manager: accounts[1],
                    _remover: accounts[0],

                    0: accounts[1],
                    1: accounts[0],

                    __length__: 2
                }
            }, 'The event is emitted');

            await expect(EMR.isManager(accounts[1])).to.eventually.be.false;
            expect((await EMR.getManagerCount()).toNumber()).to.equal(0);
        });

        it(`[addManager Z, One, Two from Z] [removeManager One from Z] [isManager Zero == true, One == false, Two == true] [getManagerCount == 2] [getManagerByIndex 1 == Two]`, async () => {

            const EMR = await instance(emr_contract_name);

            await EMR.addManager(accounts[0]);
            await EMR.addManager(accounts[1]);
            await EMR.addManager(accounts[2]);
            await EMR.removeManager(accounts[1]);

            await expect(EMR.isManager(accounts[0])).to.eventually.be.true;
            await expect(EMR.isManager(accounts[1])).to.eventually.be.false;
            await expect(EMR.isManager(accounts[2])).to.eventually.be.true;
            expect((await EMR.getManagerCount()).toNumber()).to.equal(2);
            return expect(EMR.getManagerByIndex(1)).to.eventually.equal(accounts[2]);
        });

    });

    describe('[leave] [addManager isManager getManagerCount getManagerByIndex]', () => {

        it(`[leave Z] [revert]`, async () => {

            const EMR = await instance(emr_contract_name);

            return expect(EMR.leave()).to.eventually.be.rejected;
        });

        it(`[addManager Z from Z] [leave Z] [isManager Z == false] [getManagerCount == 0]`, async () => {

            const EMR = await instance(emr_contract_name);

            await EMR.addManager(accounts[0]);
            const res = await EMR.leave();
            assert.web3Event(res, {
                event: 'LeftManager',
                args: {
                    _manager: accounts[0],

                    0: accounts[0],

                    __length__: 1
                }
            }, 'The event is emitted');

            await expect(EMR.isManager(accounts[0])).to.eventually.be.false;
            expect((await EMR.getManagerCount()).toNumber()).to.equal(0);
        });

        it(`[addManager Z, One, Two from Z] [leave One] [isManager Z == true, One == false, Two == true] [getManagerCount == 2] [getManagerByIndex 1 == Two]`, async () => {

            const EMR = await instance(emr_contract_name);

            await EMR.addManager(accounts[0]);
            await EMR.addManager(accounts[1]);
            await EMR.addManager(accounts[2]);
            await EMR.leave({from: accounts[1]});

            await expect(EMR.isManager(accounts[0])).to.eventually.be.true;
            await expect(EMR.isManager(accounts[1])).to.eventually.be.false;
            await expect(EMR.isManager(accounts[2])).to.eventually.be.true;
            expect((await EMR.getManagerCount()).toNumber()).to.equal(2);
            return expect(EMR.getManagerByIndex(1)).to.eventually.equal(accounts[2]);
        });

    });

});
