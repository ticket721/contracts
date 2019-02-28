const {exec} = require('child_process');
const {snapshot, update_config, session, revert, NET, push, remove_config_update, instance, node_modules_path, signale} = require('./setup');

const chai = require('chai');
const chaiProm = require('chai-as-promised');
require('truffle-test-utils').init();

chai.use(chaiProm);

const expect = chai.expect;

let accounts = [];

const ZEROS = '0x0000000000000000000000000000000000000000';

//const createT721 = async () => {
//    signale.info('Creating T721 proxy ...');
//    return new Promise((ok, ko) => {
//        exec(`${node_modules_path()}/.bin/zos create T721 --init initialize --args Test,TST --network ${NET.name}`, (err, stdout, stderr) => {
//            if (err) {
//                console.error(stderr);
//                return ko(err);
//            }
//            signale.success('Created T721 proxy');
//            ok();
//        })
//    })
//};

let events = {};

const createEvent = async (event_name) => {
    signale.info(`Creating ${event_name} instance ...`);
    const arti = await artifacts.require(event_name);
    events[event_name] = await arti.new();
    signale.success(`Created ${event_name} instance`);
};

const event_names = {
    MinterPayableFixed_MarketerDisabled_ApproverDisabled: 'Event_Mipafi_Madi_Apdi'
};

const create = async () => {
//    await createT721();
    //for (const event of Object.values(event_names)) {
    //    await createEvent(event);
    //}
};

contract('Event', () => {

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

    describe('[Minter]', () => {

        describe('[Test]', () => {

            it('is a placeholder', () => {

            });

        });

    });

    describe('[Marketer]', () => {

        describe('[Test]', () => {

            it('is a placeholder', () => {

            });

        });

    });

    describe('[Approver]', () => {

        describe('[Test]', () => {

            it('is a placeholder', () => {

            });

        });

    });

});
