const {exec} = require('child_process');
const {snapshot, update_config, session, revert, NET, push, remove_config_update, instance, node_modules_path, signale} = require('./setup');

const chai = require('chai');
const chaiProm = require('chai-as-promised');
require('truffle-test-utils').init();

chai.use(chaiProm);

const expect = chai.expect;

const ab_contract_name = 'AdministrationBoardV0';
const er_contract_name = 'EventRegistryV0';
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

const createEventRegistry = async () => {
    signale.info('Creating EventRegistry proxy ...');
    const AB = await instance(ab_contract_name);
    const EMR = await instance(emr_contract_name);
    return new Promise((ok, ko) => {
        exec(`${node_modules_path()}/.bin/zos create EventRegistry --init initialize --args ${AB.address},${EMR.address} --network ${NET.name}`, (err, stdout, stderr) => {
            if (err) {
                console.error(stderr);
                return ko(err);
            }
            signale.success('Created EventRegistry proxy');
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

const addManagers = async () => {
    signale.info('Adding initial Managers ...');

    const accounts = await web3.eth.getAccounts();
    const EMR = await instance(emr_contract_name);

    await EMR.addManager(accounts[0]);
    await EMR.addManager(accounts[1]);
    await EMR.addManager(accounts[2]);
    await EMR.addManager(accounts[3]);
    await EMR.addManager(accounts[4]);

    if (((await EMR.isManager(accounts[0])) === false) ||
        ((await EMR.isManager(accounts[1])) === false) ||
        ((await EMR.isManager(accounts[2])) === false) ||
        ((await EMR.isManager(accounts[3])) === false) ||
        ((await EMR.isManager(accounts[4])) === false)) {
        throw new Error('Z One Two Three and Four should be managers now');
    }
    signale.success('Added initial Managers: Z One Two Three Four');
};


let events = {};

const createEvent = async (event_name) => {
    signale.info(`Creating ${event_name} instance ...`);
    const arti = await artifacts.require(event_name);
    events[event_name] = await arti.new();
    signale.success(`Created ${event_name} instance`);
};

const event_names = {
    MinterPayableFixed_MarketerDisabled_ApproverDisabled: 'EventV0_Mipafi_Madi_Apdi'
};

const create = async () => {
    await createAdministrationBoard();
    await createEventManagersRegistry();
    await createEventRegistry();
    for (const event of Object.values(event_names)) {
        await createEvent(event);
    }
    await addMembers();
    await addManagers();
};

contract('EventRegistry', () => {

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

    describe('[registerEvent] [isRegistered]', () => {

        it('[registerEvent event from Five] [revert]', async () => {
            const ER = await instance(er_contract_name);

            return expect(ER.registerEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address,
                {from: accounts[5]})).to.eventually.be.rejected;
        });

        it('[registerEvent Five from Z] [revert]', async () => {
            const ER = await instance(er_contract_name);

            return expect(ER.registerEvent(accounts[5])).to.eventually.be.rejected;
        });

        it(`[registerEvent ${ZERO} from Z] [revert]`, async () => {
            const ER = await instance(er_contract_name);

            return expect(ER.registerEvent(ZERO)).to.eventually.be.rejected;
        });

        it (`[registerEvent event from Z] [isRegistered event == true]`, async () => {
            const ER = await instance(er_contract_name);

            const res = await ER.registerEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);
            assert.web3Event(res, {
                event: 'Event',
                args: {
                    _adder: accounts[0],
                    _event: events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address,

                    0: accounts[0],
                    1: events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address,

                    __length__: 2
                }
            }, 'The event is emitted');

            return expect(ER.isRegistered(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address)).to.eventually.be.true;
        });

    });

    describe('[kickEvent] [registerEvent isKickVoteLive voteKick isRegistered]', () => {

        it('[registerEvent event from Z] [kickEvent Five from Z] [revert]', async () => {
            const ER = await instance(er_contract_name);

            await ER.registerEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);

            return expect(ER.kickEvent(accounts[5])).to.eventually.be.rejected;
        });

        it('[registerEvent event from Z] [voteKick event true from Z] [revert]', async () => {
            const ER = await instance(er_contract_name);

            await ER.registerEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);

            return expect(ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, true)).to.eventually.be.rejected;
        });

        it('[registerEvent event from Z] [kickEvent event from Z] [kickEvent event from Z] [revert]', async () => {
            const ER = await instance(er_contract_name);

            await ER.registerEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);

            await ER.kickEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);
            return expect(ER.kickEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address)).to.eventually.be.rejected;
        });

        it('[registerEvent event from Z] [kickEvent event from Five] [revert]', async () => {
            const ER = await instance(er_contract_name);

            await ER.registerEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);

            return expect(ER.kickEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, {from: accounts[5]})).to.eventually.be.rejected;
        });

        it('[registerEvent event from Z] [kickEvent event from Z] [isKickVoteLive event == true] [Z v+ event] [One v+ event] [Two v+ event] [isKickVoteLive event == false] [isRegistered event == false]', async () => {
            const ER = await instance(er_contract_name);

            await ER.registerEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);

            await ER.kickEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);

            await expect(ER.isKickVoteLive(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address)).to.eventually.be.true;

            await ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, true);
            await ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, true, {from: accounts[1]});

            const res = await ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, true, {from: accounts[2]});
            assert.web3Event(res, {
                event: 'KickedEvent',
                args: {
                    _event: events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address,

                    0: events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address,

                    __length__: 1
                }
            }, 'The event is emitted');

            expect(await ER.isKickVoteLive(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address)).to.be.false;
            return expect(ER.isRegistered(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address)).to.eventually.be.false;

        });

        it('[registerEvent event from Z] [kickEvent event from Z] [isKickVoteLive event == true] [Z v- event] [One v- event] [Two v- event] [isKickVoteLive event == false] [isRegistered event == true]', async () => {
            const ER = await instance(er_contract_name);

            await ER.registerEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);

            await ER.kickEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);

            await expect(ER.isKickVoteLive(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address)).to.eventually.be.true;

            await ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, false);
            await ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, false, {from: accounts[1]});

            const res = await ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, false, {from: accounts[2]});
            assert.web3Event(res, {
                event: 'KickFailed',
                args: {
                    _event: events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address,

                    0: events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address,

                    __length__: 1
                }
            }, 'The event is emitted');

            expect(await ER.isKickVoteLive(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address)).to.be.false;
            return expect(ER.isRegistered(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address)).to.eventually.be.true;

        });

        it('[registerEvent event from Z] [kickEvent event from Z] [isKickVoteLive event == true] [Z v+ event] [One v+ event] [Z v- event] [Two v+ event] [isRegistered event == true] [Z v+ event] [isRegistered event == false]', async () => {
            const ER = await instance(er_contract_name);

            await ER.registerEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);

            await ER.kickEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);

            await expect(ER.isKickVoteLive(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address)).to.eventually.be.true;

            await ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, true);
            await ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, true, {from: accounts[1]});
            await ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, false);
            await ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, true, {from: accounts[2]});

            await expect(ER.isRegistered(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address)).to.eventually.be.true;

            await ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, true);

            return expect(ER.isRegistered(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address)).to.eventually.be.false;
        });

        it('[registerEvent event from Z] [kickEvent event from Z] [isKickVoteLive event == true] [Z v- event] [Z v- event] [revert]', async () => {
            const ER = await instance(er_contract_name);

            await ER.registerEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);

            await ER.kickEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);

            await expect(ER.isKickVoteLive(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address)).to.eventually.be.true;

            await ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, false);
            return expect(ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, false)).to.eventually.be.rejected;
        });

        it('[registerEvent event from Z] [kickEvent event from Z] [isKickVoteLive event == true] [Z v+ event] [Z v+ event] [revert]', async () => {
            const ER = await instance(er_contract_name);

            await ER.registerEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);

            await ER.kickEvent(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address);

            await expect(ER.isKickVoteLive(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address)).to.eventually.be.true;

            await ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, true);
            return expect(ER.voteKick(events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled].address, true)).to.eventually.be.rejected;
        });

    });

});
