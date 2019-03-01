const {exec} = require('child_process');
const {snapshot, update_config, session, revert, NET, push, remove_config_update, instance, node_modules_path, signale} = require('./setup');

const chai = require('chai');
const chaiProm = require('chai-as-promised');
require('truffle-test-utils').init();

chai.use(chaiProm);

const expect = chai.expect;

const contract_name = 'AdministrationBoardV0';

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

const create = async () => {
    await createAdministrationBoard();
};

contract('AdministrationBoard', () => {

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

    describe('[isMember]', () => {

        it('[isMember Z == true]', async () => {
            const AB = await instance(contract_name);
            return expect(AB.isMember.call(accounts[0])).to.eventually.be.true;

        });

        it('[isMember One == false]', async () => {
            const AB = await instance(contract_name);
            return expect(AB.isMember.call(accounts[1])).to.eventually.be.false;
        });

    });

    describe('[addMember] [voteAdd isAddVoteLive isMember]', () => {

        it('[Z v+ true One] [revert]', async () => {
            const AB = await instance(contract_name);
            return expect(AB.voteAdd(accounts[1], true)).to.eventually.be.rejected;
        });

        it('[Z + One] [isMember One == false] [isAddVoteLive One == true] [Z v+ true One] [isMember One == true] [isAddVoteLive One == false]', async () => {

            const AB = await instance(contract_name);
            let res = await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            assert.web3Event(res, {
                event: 'AdditionVote',
                args: {
                    _new_admin: accounts[1],

                    0: accounts[1],

                    __length__: 1
                }
            }, 'The event is emitted');
            await expect(AB.isMember.call(accounts[1])).to.eventually.be.false;
            await expect(AB.isAddVoteLive.call(accounts[1])).to.eventually.be.true;

            res = await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            assert.web3Event(res, {
                event: 'NewAdmin',
                args: {
                    _admin: accounts[1],

                    0: accounts[1],

                    __length__: 1
                }
            }, 'The event is emitted');

            await expect(AB.isMember.call(accounts[1])).to.eventually.be.true;
            return expect(AB.isAddVoteLive.call(accounts[1])).to.eventually.be.false;

        });

        it('[Z + One] [isMember One == false] [isAddVoteLive One == true] [Z v+ false One] [isMember One == false] [isAddVoteLive One == false]', async () => {

            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            await expect(AB.isMember.call(accounts[1])).to.eventually.be.false;
            await expect(AB.isAddVoteLive.call(accounts[1])).to.eventually.be.true;

            const res = await AB.voteAdd.sendTransaction(accounts[1], false, {from: accounts[0]});
            assert.web3Event(res, {
                event: 'AdditionRefused',
                args: {
                    _new_admin: accounts[1],

                    0: accounts[1],

                    __length__: 1
                }
            }, 'The event is emitted');

            await expect(AB.isMember.call(accounts[1])).to.eventually.be.false;
            await expect(AB.isAddVoteLive.call(accounts[1])).to.eventually.be.false;

        });

        it('[addMember Z from Z] [revert]', async () => {

            const AB = await instance(contract_name);
            return expect(AB.addMember.sendTransaction(accounts[0], {from: accounts[0]}))
                .to.eventually.be.rejected;

        });

        it('[addMember One from Z] [Z + One from Z] [revert]', async () => {

            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            return expect(AB.addMember.sendTransaction(accounts[1], {from: accounts[0]}))
                .to.eventually.be.rejected;

        });

        it('[addMember Two from One] [revert]', async () => {

            const AB = await instance(contract_name);
            return expect(AB.addMember.sendTransaction(accounts[2], {from: accounts[1]}))
                .to.eventually.be.rejected;

        });

        it('[Z One Two members] [addMember Three from Z] [Z v+ true Three] [One v+ true Three] [isMember Three == true]', async () => {

            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[2], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[3], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[0]});
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[2])).to.be.true;

            await AB.voteAdd.sendTransaction(accounts[3], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[3])).to.be.false;
            await AB.voteAdd.sendTransaction(accounts[3], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[3])).to.be.true;

        });

        it('[Z One Two members] [Z + Three] [Z v+ true Three] [One v+ false Three] [One v+ true Three] [isMember Three == true]', async () => {

            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[2], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[3], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[0]});
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[2])).to.be.true;

            await AB.voteAdd.sendTransaction(accounts[3], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[3])).to.be.false;
            await AB.voteAdd.sendTransaction(accounts[3], false, {from: accounts[1]});
            expect(await AB.isMember(accounts[3])).to.be.false;
            await AB.voteAdd.sendTransaction(accounts[3], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[3])).to.be.true;

        });

        it('[Z One Two Members] [Z + Three] [One v+ true Three] [One v+ false Three] [Z v+ true Three] [One v+ true Three] [isMember Three == true]', async () => {

            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[2], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[3], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[0]});
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[2])).to.be.true;

            await AB.voteAdd.sendTransaction(accounts[3], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[3])).to.be.false;
            await AB.voteAdd.sendTransaction(accounts[3], false, {from: accounts[1]});
            expect(await AB.isMember(accounts[3])).to.be.false;
            await AB.voteAdd.sendTransaction(accounts[3], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[3])).to.be.false;
            await AB.voteAdd.sendTransaction(accounts[3], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[3])).to.be.true;

        });

        it('[Z One Two members] [Z + Three] [One v+ true Three] [One v+ true Three] [revert]', async () => {

            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[2], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[3], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[0]});
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[2])).to.be.true;

            await AB.voteAdd.sendTransaction(accounts[3], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[3])).to.be.false;
            return expect(AB.voteAdd.sendTransaction(accounts[3], true, {from: accounts[1]}))
                .to.eventually.be.rejected;

        });

        it('[Z One Two members] [Z + Three] [One v+ false Three] [One v+ false Three] [revert]', async () => {

            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[2], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[3], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[0]});
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[2])).to.be.true;

            await AB.voteAdd.sendTransaction(accounts[3], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[3])).to.be.false;
            await AB.voteAdd.sendTransaction(accounts[3], false, {from: accounts[1]});
            expect(await AB.isMember(accounts[3])).to.be.false;
            return expect(AB.voteAdd.sendTransaction(accounts[3], false, {from: accounts[1]}))
                .to.eventually.be.rejected;

        });

        it('[Z One Two members] [Z + Three] [Z v+ true Three] [One v+ false Three] [getVote 1 1]', async () => {

            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[2], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[3], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[0]});
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[2])).to.be.true;

            await AB.voteAdd.sendTransaction(accounts[3], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[3])).to.be.false;
            await AB.voteAdd.sendTransaction(accounts[3], false, {from: accounts[1]});
            expect(await AB.isMember(accounts[3])).to.be.false;
            const result = await AB.getVote(1, accounts[3]);
            expect(result.yes.toNumber()).to.equal(1);
            expect(result.no.toNumber()).to.equal(1);

        });

    });

    describe('[kickMember] [voteKick isKickVoteLive addMember voteAdd isMember]', () => {

        it('[One not member] [One - Z] [revert]', async () => {
            const AB = await instance(contract_name);

            return expect(AB.kickMember(accounts[0], {from: accounts[1]}))
                .to.eventually.be.rejected;
        });

        it('[Z - Z] [revert]', async () => {
            const AB = await instance(contract_name);

            return expect(AB.kickMember(accounts[0], {from: accounts[0]}))
                .to.eventually.be.rejected;
        });

        it('[Z One members] [Z - Five] [Z - One] [revert]', async () => {
            const AB = await instance(contract_name);

            return expect(AB.kickMember.sendTransaction(accounts[5], {from: accounts[0]})).to.eventually.be.rejected;
        });

        it('[Z One members] [Z v- One true] [revert]', async () => {
            const AB = await instance(contract_name);

            return expect(AB.voteKick.sendTransaction(accounts[1], true, {from: accounts[0]})).to.eventually.be.rejected;
        });

        it('[Z One members] [Z - One] [Z - One] [revert]', async () => {
            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;

            await AB.kickMember.sendTransaction(accounts[1], {from: accounts[0]});
            return expect(AB.kickMember.sendTransaction(accounts[1], {from: accounts[0]})).to.eventually.be.rejected;
        });

        it('[Z One members] [Z - One] [Z v- true One] [isMember One == true]', async () => {
            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;

            const res = await AB.kickMember.sendTransaction(accounts[1], {from: accounts[0]});

            assert.web3Event(res, {
                event: 'KickVote',
                args: {
                    _admin: accounts[1],

                    0: accounts[1],

                    __length__: 1
                }
            }, 'The event is emitted');

            await AB.voteKick.sendTransaction(accounts[1], true, {from: accounts[0]});
            // TODO Find out why the fuck do we only get the first two events ?
            //assert.web3Event(res, {
            //    event: 'KickRefused',
            //    args: {
            //        _member: accounts[1],

            //        0: accounts[1],

            //        __length__: 1
            //    }
            //}, 'The event is emitted');

            expect(await AB.isMember(accounts[1])).to.be.true;
        });

        it('[Z One Two members] [Z - One] [Z v- true One] [Two v- true One] [isMember One == false]', async () => {
            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[2], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[3], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[0]});
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[2])).to.be.true;

            await AB.kickMember.sendTransaction(accounts[1], {from: accounts[0]});

            /*const res = */
            await AB.voteKick.sendTransaction(accounts[1], true, {from: accounts[0]});
            // TODO Find out why the fuck do we only get the first two events ?
            //assert.web3Event(res, {
            //    event: 'KickedMember',
            //    args: {
            //        _member: accounts[1],

            //        0: accounts[1],

            //        __length__: 1
            //    }
            //}, 'The event is emitted');

            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteKick.sendTransaction(accounts[1], true, {from: accounts[2]});
            expect(await AB.isMember(accounts[1])).to.be.false;
        });

        it('[Z One Two members] [Z - One] [Z v- false One] [Two v- true One] [Z v- true One] [isMember One == false]', async () => {
            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[2], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[3], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[0]});
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[2])).to.be.true;

            await AB.kickMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.voteKick.sendTransaction(accounts[1], false, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteKick.sendTransaction(accounts[1], true, {from: accounts[2]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteKick.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.false;
        });

        it('[Z One Two members] [Z - One] [Z v- true One] [Z v- false One] [Two v- true One] [isMember One == true]', async () => {
            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[2], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[3], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[0]});
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[2])).to.be.true;

            await AB.kickMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.voteKick.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteKick.sendTransaction(accounts[1], false, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteKick.sendTransaction(accounts[1], true, {from: accounts[2]});
            expect(await AB.isMember(accounts[1])).to.be.true;
        });

        it('[Z One Two members] [Z - One] [Z v- true One] [Z v- true One] [revert]', async () => {
            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[2], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[3], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[0]});
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[2])).to.be.true;

            await AB.kickMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.voteKick.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            return expect(AB.voteKick.sendTransaction(accounts[1], true, {from: accounts[0]}))
                .to.eventually.be.rejected;
        });

        it('[Z One Two members] [Z - One] [Z v- false One] [Z v- false One] [revert]', async () => {
            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[2], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[3], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[0]});
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[2])).to.be.true;

            await AB.kickMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.voteKick.sendTransaction(accounts[1], false, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            return expect(AB.voteKick.sendTransaction(accounts[1], false, {from: accounts[0]}))
                .to.eventually.be.rejected;
        });

        it('[Z One Two members] [Z - One] [Z v- false One] [One v- false One] [isMember One == true]', async () => {
            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[2], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[3], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[0]});
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[2])).to.be.true;

            await AB.kickMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.voteKick.sendTransaction(accounts[1], false, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteKick.sendTransaction(accounts[1], false, {from: accounts[1]});
            expect(await AB.isMember(accounts[1])).to.be.true;
        });

        it('[Z One Two members] [Z - One] [isKickVoteLive One == true]', async () => {
            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[2], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[3], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[0]});
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[2])).to.be.true;

            await AB.kickMember.sendTransaction(accounts[1], {from: accounts[0]});
            expect(await AB.isKickVoteLive(accounts[1])).to.be.true;
        });

        it('[Z One Two members] [Z - One] [Z v- false One] [One v- false One] [getVote 1 1]', async () => {
            const AB = await instance(contract_name);
            await AB.addMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[2], {from: accounts[0]});
            await AB.addMember.sendTransaction(accounts[3], {from: accounts[0]});

            await AB.voteAdd.sendTransaction(accounts[1], true, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[0]});
            await AB.voteAdd.sendTransaction(accounts[2], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[2])).to.be.true;

            await AB.kickMember.sendTransaction(accounts[1], {from: accounts[0]});
            await AB.voteKick.sendTransaction(accounts[1], false, {from: accounts[0]});
            expect(await AB.isMember(accounts[1])).to.be.true;
            await AB.voteKick.sendTransaction(accounts[1], true, {from: accounts[1]});
            expect(await AB.isMember(accounts[1])).to.be.true;

            const result = await AB.getVote(2, accounts[1]);
            expect(result.yes.toNumber()).to.equal(1);
            expect(result.no.toNumber()).to.equal(1);
        });


    });

    describe('[leave] [isMember]', () => {

        it('[leave From Z]', async () => {
            const AB = await instance(contract_name);

            const res = await AB.leave.sendTransaction({from: accounts[0]});
            assert.web3Event(res, {
                event: 'DeleteAdmin',
                args: {
                    _admin: accounts[0],

                    0: accounts[0],

                    __length__: 1
                }
            }, 'The event is emitted');

            expect(await AB.isMember(accounts[0])).to.be.false;

        });

        it('[leave from One] [revert]', async () => {
            const AB = await instance(contract_name);

            return expect(AB.leave.sendTransaction({from: accounts[1]}))
                .to.eventually.be.rejected;

        });

    });

    describe('[getVote]', () => {

        it('[getVote arg 3] [revert]', async () => {
            const AB = await instance(contract_name);


            return expect(AB.getVote(3, accounts[0]))
                .to.eventually.be.rejected;
        });

        it('[getVote arg 2] [revert]', async () => {
            const AB = await instance(contract_name);


            return expect(AB.getVote(2, accounts[0]))
                .to.eventually.be.rejected;
        });

        it('[getVote arg 1] [revert]', async () => {
            const AB = await instance(contract_name);


            return expect(AB.getVote(1, accounts[0]))
                .to.eventually.be.rejected;
        });

    });

});
