const {exec} = require('child_process');
const {snapshot, update_config, session, revert, NET, push, remove_config_update, instance, node_modules_path, signale, get_all_events} = require('./setup');

const chai = require('chai');
const chaiProm = require('chai-as-promised');
require('truffle-test-utils').init();

chai.use(chaiProm);

const expect = chai.expect;

const contract_name = 'T721V0';
const ab_contract_name = 'AdministrationBoardV0';

let accounts = [];

const ERC165_interface = '0x01ffc9a7';
const ERC721Basic_interface = '0xcff9d6b4';
const ERC721Enumerable_interface = '0x780e9d63';
const ERC721Metadata_interface = '0x5b5e139f';

const ZEROS = '0x0000000000000000000000000000000000000000';

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

const createT721 = async () => {

    signale.info('Creating T721 proxy ...');
    const AB = await instance(ab_contract_name);
    const accounts = await web3.eth.getAccounts();
    await new Promise((ok, ko) => {
        exec(`${node_modules_path()}/.bin/zos create T721 --init initialize --args ${AB.address},Test,TST,uri --network ${NET.name}`, (err, stdout, stderr) => {
            if (err) {
                console.error(stderr);
                return ko(err);
            }
            signale.success('Created T721 proxy');
            ok();
        })
    });

    const t721 = await instance(contract_name);
    const all_events = get_all_events();
    for (const event of all_events) {
        const bytecode = event[1].deployedBytecode;

        const bytes = Buffer.from(bytecode.slice(2), 'hex');

        signale.info(`Whitelisting event ${event[0]}`);
        await t721.set_event_code(bytes, true, {
            from: accounts[0]
        });
        signale.success(`Whitelisted event ${event[0]}`);
    }

};

let testERC721Receiver = null;
let badTestERC721Receiver = null;

const createTestERC721Receiver = async () => {

    signale.info('Creating TestERC721Receiver instance ...');
    const TERC721R = await artifacts.require('TestERC721Receiver');
    testERC721Receiver = await TERC721R.new();
    signale.success('Created TestERC721Receiver instance');

};

const createBadTestERC721Receiver = async () => {

    signale.info('Creating BadTestERC721Receiver instance ...');
    const BTERC721R = await artifacts.require('BadTestERC721Receiver');
    badTestERC721Receiver = await BTERC721R.new();
    signale.success('Created BadTestERC721Receiver instance');

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

const event_names = {

    MinterPayableFixed_MarketerDisabled_ApproverDisabled: 'Event_Mipafi_Madi_Apdi',
    MinterPayableFixed_MarketerTester_ApproverTester: 'Event_Mipafi_Mate_Apte',
    MinterPayableFixed_MarketerTester_ApproverDisabled: 'Event_Mipafi_Mate_Apdi'

};

const event_initializers = {

    'Event_Mipafi_Madi_Apdi': [1000, 1000, Math.floor(Date.now() / 1000) + (12 * 60 * 60)],
    'Event_Mipafi_Mate_Apte': [1000, 1000, Math.floor(Date.now() / 1000) + (12 * 60 * 60)],
    'Event_Mipafi_Mate_Apdi': [1000, 1000, Math.floor(Date.now() / 1000) + (12 * 60 * 60)]

};

let events = {};

const createEvent = async (event_name, address, args) => {
    signale.info(`Creating ${event_name} instance ...`);
    const arti = await artifacts.require(event_name);
    events[event_name] = await arti.new(address, ...args);
    await events[event_name].start();
    signale.success(`Created ${event_name} instance`);
};

const create = async () => {

    await createAdministrationBoard();
    await createT721();
    await createTestERC721Receiver();
    await createBadTestERC721Receiver();
    await addMembers();
    const t721_address = (await instance(contract_name)).address;
    for (const event of Object.values(event_names)) {
        await createEvent(event, t721_address, event_initializers[event]);
    }

};

contract('T721', () => {

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

    describe('[ERC165]', () => {

        describe('[supportsInterface]', () => {
            it('[supportsInterface ERC165] [true]', async () => {

                const T721 = await instance(contract_name);
                return expect(T721.supportsInterface(ERC165_interface))
                    .to.eventually.be.true;

            });

            it('[supportsInterface ERC721Metadata] [true]', async () => {

                const T721 = await instance(contract_name);
                return expect(T721.supportsInterface(ERC721Metadata_interface))
                    .to.eventually.be.true;

            });

            it('[supportsInterface ERC721Enumerable] [true]', async () => {

                const T721 = await instance(contract_name);
                return expect(T721.supportsInterface(ERC721Enumerable_interface))
                    .to.eventually.be.true;

            });

            it('[supportsInterface ERC721Basic] [true]', async () => {

                const T721 = await instance(contract_name);
                return expect(T721.supportsInterface(ERC721Basic_interface))
                    .to.eventually.be.true;

            });

            it('[supportsInterface ???] [false]', async () => {

                const T721 = await instance(contract_name);
                return expect(T721.supportsInterface('0x02ffc9a7'))
                    .to.eventually.be.false;

            });

        });

    });

    describe('[ERC721Basic]', () => {

        describe('[balanceOf] [mint transferFrom]', () => {

            it('[balancOf Z] [0]', async () => {

                const T721 = await instance(contract_name);
                expect((await T721.balanceOf(accounts[0])).toNumber())
                    .to.equal(0);

            });

            it('[balancOf Z] [mint Z] [1]', async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);
                expect((await T721.balanceOf(accounts[0])).toNumber())
                    .to.equal(1);

            });

            it('[balancOf Z] [mint Z] [mint Z] [mint Z] [transferFrom Z One 2] [balanceOf Z == 2]', async () => {

                const T721 = await instance(contract_name);

                await T721.mint(accounts[0], 0, ZEROS);
                await T721.mint(accounts[0], 0, ZEROS);
                await T721.mint(accounts[0], 0, ZEROS);

                await T721.transferFrom(accounts[0], accounts[1], 2);

                expect((await T721.balanceOf(accounts[0])).toNumber())
                    .to.equal(2);

            });

        });

        describe('[ownerOf] [mint]', () => {

            it('[ownerOf 1] [revert]', async () => {

                const T721 = await instance(contract_name);
                return expect(T721.ownerOf(1))
                    .to.eventually.be.rejected;

            });

            it('[mint Z] [ownerOf 1 == Z]', async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);
                return expect(T721.ownerOf(1))
                    .to.eventually.equal(accounts[0]);

            });

        });

        describe('[exists] [mint]', () => {

            it('[exists 0 == false]', async () => {

                const T721 = await instance(contract_name);
                return expect(T721.exists(0)).to.eventually.be.rejected;

            });

            it('[exists 1 == false]', async () => {

                const T721 = await instance(contract_name);
                return expect(T721.exists(1)).to.eventually.be.false;

            });

            it('[mint Z] [exists 1 == true]', async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);
                return expect(T721.exists(1)).to.eventually.be.true;

            });

        });

        describe('[approve] [getApproved mint]', () => {

            it('[getApproved 0] [revert]', async () => {

                const T721 = await instance(contract_name);
                return expect(T721.getApproved(0)).to.eventually.be.rejected;

            });

            it(`[getApproved 1 == ${ZEROS}]`, async () => {

                const T721 = await instance(contract_name);
                return expect(T721.getApproved(1)).to.eventually.equal(ZEROS);

            });

            it(`[mint Z] [approve One 1 from Z] [getApproved 1 == One]`, async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);
                const res = await T721.approve(accounts[1], 1);
                assert.web3Event(res, {
                    event: 'Approval',
                    args: {
                        _owner: accounts[0],
                        _approved: accounts[1],
                        _ticket_id: 1,

                        0: accounts[0],
                        1: accounts[1],
                        2: 1,

                        __length__: 3
                    }
                }, 'The event is emitted');
                return expect(T721.getApproved(1)).to.eventually.equal(accounts[1]);

            });

            it(`[approve One 0 from Z] [revert]`, async () => {

                const T721 = await instance(contract_name);
                expect(T721.approve(accounts[1], 0)).to.eventually.be.rejected;

            });

            it(`[approve One 1 from Z] [revert]`, async () => {

                const T721 = await instance(contract_name);
                expect(T721.approve(accounts[1], 1)).to.eventually.be.rejected;

            });

            it(`[mint Z] [approve ${ZEROS} 1 from Z] [revert]`, async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);
                return expect(T721.approve(ZEROS, 1)).to.eventually.be.rejected;

            });

            it(`[mint Z] [approve One 1 from Z] [getApproved 1 == One] [approve ${ZEROS} 1 from Z] [getApproved 1 == ${ZEROS}]`, async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);
                await T721.approve(accounts[1], 1);
                await expect(T721.getApproved(1)).to.eventually.equal(accounts[1]);
                await T721.approve(ZEROS, 1);
                return expect(T721.getApproved(1)).to.eventually.equal(ZEROS);

            });

        });

        describe('[setApprovalForAll] [isApprovedForAll]', () => {

            it(`[setApprovalForAll ${ZEROS} true from Z] [revert]`, async () => {

                const T721 = await instance(contract_name);
                return expect(T721.setApprovalForAll(ZEROS, true)).to.eventually.be.rejected;

            });

            it(`[setApprovalForAll One false from Z] [revert]`, async () => {

                const T721 = await instance(contract_name);
                return expect(T721.setApprovalForAll(accounts[1], false)).to.eventually.be.rejected;

            });

            it(`[setApprovalForAll One true from Z] [isApprovedForAll Z One == true]`, async () => {

                const T721 = await instance(contract_name);
                const res = await T721.setApprovalForAll(accounts[1], true);
                assert.web3Event(res, {
                    event: 'ApprovalForAll',
                    args: {
                        _owner: accounts[0],
                        _operator: accounts[1],
                        _approved: true,

                        0: accounts[0],
                        1: accounts[1],
                        2: true,

                        __length__: 3
                    }
                }, 'The event is emitted');
                return expect(T721.isApprovedForAll(accounts[0], accounts[1])).to.eventually.be.true;

            });

            it(`[setApprovalForAll One true from Z] [setApprovalForAll One false from Z] [isApprovedForAll Z One == false]`, async () => {

                const T721 = await instance(contract_name);
                await T721.setApprovalForAll(accounts[1], true);
                await T721.setApprovalForAll(accounts[1], false);
                return expect(T721.isApprovedForAll(accounts[0], accounts[1])).to.eventually.be.false;

            });

        });

        describe('[transferFrom] [mint balanceOf approve getApproved]', () => {

            it('[transferFrom Z One 0 from Z] [revert]', async () => {

                const T721 = await instance(contract_name);
                return expect(T721.transferFrom(accounts[0], accounts[1], 0)).to.eventually.be.rejected;

            });

            it(`[transferFrom Z One 1 from Z] [revert]`, async () => {

                const T721 = await instance(contract_name);
                return expect(T721.transferFrom(accounts[0], accounts[1], 1)).to.eventually.be.rejected;

            });

            it(`[mint Z] [transferFrom Z One 1 from One] [revert]`, async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);
                return expect(T721.transferFrom(accounts[0], accounts[1], 1, {from: accounts[1]})).to.eventually.be.rejected;

            });

            it(`[mint Z] [transferFrom ${ZEROS} One 1 from Z] [revert]`, async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);
                return expect(T721.transferFrom(ZEROS, accounts[1], 1)).to.eventually.be.rejected;

            });

            it(`[mint Z] [transferFrom Z ${ZEROS} 1 from Z] [revert]`, async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);
                return expect(T721.transferFrom(accounts[0], ZEROS, 1)).to.eventually.be.rejected;

            });

            it(`[mint Z] [transferFrom One Z 1 from Z] [revert]`, async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);
                return expect(T721.transferFrom(accounts[1], accounts[0], 1)).to.eventually.be.rejected;

            });

            it(`[event.mint Z] [transferFrom Z One 1 from Z] [balanceOf One == 1] [balanceOf Z == 0]`, async () => {

                const T721 = await instance(contract_name);
                const event = events[event_names.MinterPayableFixed_MarketerTester_ApproverDisabled];

                await event.mint({value: 1000});

                await T721.transferFrom(accounts[0], accounts[1], 1);

                expect((await T721.balanceOf(accounts[1])).toNumber()).to.equal(1);
                expect((await T721.balanceOf(accounts[0])).toNumber()).to.equal(0);

            });

            it(`[event.mint Z] [transferFrom Z One 1 from Z] [revert]`, async () => {

                const T721 = await instance(contract_name);
                const event = events[event_names.MinterPayableFixed_MarketerTester_ApproverTester];

                await event.mint({value: 1000});

                return expect(T721.transferFrom(accounts[0], accounts[1], 1)).to.eventually.be.rejected;

            });

            it(`[event.mint Z] [event.sell 1 2000] [transferFrom Z One 1 from Z]`, async () => {

                const T721 = await instance(contract_name);
                const event = events[event_names.MinterPayableFixed_MarketerTester_ApproverTester];

                await event.mint({value: 1000});
                await event.sell(1, 2000, Math.floor(Date.now() / 1000) * (60 * 60));

                return expect(T721.transferFrom(accounts[0], accounts[1], 1)).to.eventually.be.rejected;

            });

            it(`[mint Z] [transferFrom Z One 1 from Z] [balanceOf One == 1] [balanceOf Z == 0]`, async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);

                const res = await T721.transferFrom(accounts[0], accounts[1], 1);
                assert.web3Event(res, {
                    event: 'Transfer',
                    args: {
                        _from: accounts[0],
                        _to: accounts[1],
                        _ticket_id: 1,

                        0: accounts[0],
                        1: accounts[1],
                        2: 1,

                        __length__: 3
                    }
                }, 'The event is emitted');

                expect((await T721.balanceOf(accounts[1])).toNumber()).to.equal(1);
                expect((await T721.balanceOf(accounts[0])).toNumber()).to.equal(0);

            });

            it(`[mint Z] [approve Two 1 from Z] [transferFrom Z One 1 from Two] [balanceOf One == 1] [balanceOf Z == 0] [getApproved 1 == ${ZEROS}]`, async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);
                await T721.approve(accounts[2], 1);
                await T721.transferFrom(accounts[0], accounts[1], 1, {from: accounts[2]});
                expect((await T721.balanceOf(accounts[1])).toNumber()).to.equal(1);
                expect((await T721.balanceOf(accounts[0])).toNumber()).to.equal(0);
                expect((await T721.getApproved(1))).to.equal(ZEROS);

            });

            it(`[mint Z] [setApprovalForAll Two true from Z] [transferFrom Z One 1 from Two] [balanceOf One == 1] [balanceOf Z == 0]`, async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);
                await T721.setApprovalForAll(accounts[2], true);
                await T721.transferFrom(accounts[0], accounts[1], 1, {from: accounts[2]});
                expect((await T721.balanceOf(accounts[1])).toNumber()).to.equal(1);
                expect((await T721.balanceOf(accounts[0])).toNumber()).to.equal(0);

            });

        });

        describe('[safeTransferFrom] [mint balanceOf]', () => {

            it(`[mint Z] [safeTransferFrom Z TERCR 1 from Z] [balanceOf TERCR == 1] [balanceOf Z == 0] [TERCR.last_received_token == 1] [TERCR.last_received_data == null]`, async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);

                await T721.methods['safeTransferFrom(address,address,uint256)'](accounts[0], testERC721Receiver.address, 1);
                expect((await T721.balanceOf(testERC721Receiver.address)).toNumber()).to.equal(1);
                expect((await T721.balanceOf(accounts[0])).toNumber()).to.equal(0);
                expect((await testERC721Receiver.last_received_token()).toNumber()).to.equal(1);
                expect(await testERC721Receiver.last_received_data()).to.equal(null);

            });

            it(`[mint Z] [safeTransferFrom Z BTERCR 1 from Z] [revert]`, async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);

                return expect(T721.methods['safeTransferFrom(address,address,uint256)'](accounts[0], badTestERC721Receiver.address, 1)).to.eventually.be.rejected;

            });

            it(`[mint Z] [safeTransferFrom Z TERCR 1 "0xabcd" from Z] [balanceOf TERCR == 1] [balanceOf Z == 0] [TERCR.last_received_token == 1] [TERCR.last_received_data == 0xabcd]`, async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);

                await T721.methods['safeTransferFrom(address,address,uint256,bytes)'](accounts[0], testERC721Receiver.address, 1, '0xabcd');
                expect((await T721.balanceOf(testERC721Receiver.address)).toNumber()).to.equal(1);
                expect((await T721.balanceOf(accounts[0])).toNumber()).to.equal(0);
                expect((await testERC721Receiver.last_received_token()).toNumber()).to.equal(1);
                expect(await testERC721Receiver.last_received_data()).to.equal('0xabcd');

            });

            it(`[mint Z] [safeTransferFrom Z BTERCR 1 "0xabcd" from Z] [revert]`, async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0], 0, ZEROS);

                return expect(T721.methods['safeTransferFrom(address,address,uint256,bytes)'](accounts[0], badTestERC721Receiver.address, 1, '0xabcd')).to.eventually.be.rejected;

            });

        })

    });

    describe('[ERC721Enumerable]', () => {

        describe('[totalSupply] [mint]', () => {

            it('[totalSupply == 0]', async () => {

                const T721 = await instance(contract_name);
                expect((await T721.totalSupply()).toNumber()).to.equal(0);

            });

            it('[mint Z] [mint One] [mint Two] [mint Three] [mint Four] [totalSupply == 5]', async () => {

                const T721 = await instance(contract_name);

                await T721.mint(accounts[0], 0, ZEROS);
                await T721.mint(accounts[1], 0, ZEROS);
                await T721.mint(accounts[2], 0, ZEROS);
                await T721.mint(accounts[3], 0, ZEROS);
                await T721.mint(accounts[4], 0, ZEROS);

                expect((await T721.totalSupply()).toNumber()).to.equal(5);

            });

        });

        describe('[tokenByIndex] [mint]', () => {

            it('[tokenByIndex 0] [revert]', async () => {

                const T721 = await instance(contract_name);

                return expect(T721.tokenByIndex(0)).to.eventually.be.rejected;

            });

            it('[mint Z] [tokenByIndex 0 == 1]', async () => {

                const T721 = await instance(contract_name);

                await T721.mint(accounts[0], 0, ZEROS);

                expect((await T721.tokenByIndex(0)).toNumber()).to.equal(1);

            })

        });

        describe('[tokenOfOwnerByIndex] [mint transferFrom balanceOf]', () => {

            it('[tokenByIndex Z 0] [revert]', async () => {

                const T721 = await instance(contract_name);

                return expect(T721.tokenOfOwnerByIndex(accounts[0], 0)).to.eventually.be.rejected;

            });

            it('[mint Z] [tokenOfOwnerByIndex 0 == 1]', async () => {

                const T721 = await instance(contract_name);

                await T721.mint(accounts[0], 0, ZEROS);

                expect((await T721.tokenOfOwnerByIndex(accounts[0], 0)).toNumber()).to.equal(1);

            });

            it('[mint Z] [mint Z] [mint Z] [mint Z] [mint Z] [transferFrom Z Two 1 from Z] [balanceOf Z == 4] [tokenOfOwnerByIndex 1 == 3]', async () => {

                const T721 = await instance(contract_name);

                await T721.mint(accounts[0], 0, ZEROS);
                await T721.mint(accounts[0], 0, ZEROS);
                await T721.mint(accounts[0], 0, ZEROS);
                await T721.mint(accounts[0], 0, ZEROS);
                await T721.mint(accounts[0], 0, ZEROS);

                await T721.transferFrom(accounts[0], accounts[1], 2);

                expect((await T721.balanceOf(accounts[0])).toNumber()).to.equal(4);
                expect((await T721.tokenOfOwnerByIndex(accounts[0], 1)).toNumber()).to.equal(3);

            })

        });
    });

    describe('[ERC721Metadata]', () => {

        describe('[name]', () => {

            it('[name == Test]', async () => {

                const T721 = await instance(contract_name);

                return expect(T721.name()).to.eventually.equal('Test');

            })

        });

        describe('[symbol]', () => {

            it('[symbol == TST]', async () => {

                const T721 = await instance(contract_name);

                return expect(T721.symbol()).to.eventually.equal('TST');

            });

        });

        describe('[tokenURI] [mint]', () => {

            it('[tokenURI 0] [revert]', async () => {

                const T721 = await instance(contract_name);

                return expect(T721.tokenURI(0)).to.eventually.be.rejected;

            });

            it('[mint Z] [tokenURI 0 == ""]', async () => {

                const T721 = await instance(contract_name);

                await T721.mint(accounts[0], 0, ZEROS);

                return expect(T721.tokenURI(1)).to.eventually.equal('');

            });

            it(`[event.mint Z] [tokenURI 1 == 'uri1'] [tokenURI 2 == 'uri2']`, async () => {

                const T721 = await instance(contract_name);
                const event = events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled];

                await event.mint({value: 1000});

                await expect(T721.tokenURI(1)).to.eventually.equal('uri1');

                await event.mint({value: 1000});

                return expect(T721.tokenURI(2)).to.eventually.equal('uri2');

            });

            it(`[event.mint Z] [tokenURI 1 == 'uri1'] [set_server test] [tokenURI 1 === 'test1']`, async () => {

                const T721 = await instance(contract_name);
                const event = events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled];

                await event.mint({value: 1000});

                await expect(T721.tokenURI(1)).to.eventually.equal('uri1');

                await T721.set_server('test', {from: accounts[0]});

                return expect(T721.tokenURI(1)).to.eventually.equal('test1');

            });

        });

    });

    describe('[mint] [getIssuer]', () => {

        it(`[event.mint Z value 1000]`, async () => {

            const T721 = await instance(contract_name);
            const event = events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled];

            const res = await event.mint({value: 1000});
            const event_solidity = res.receipt.rawLogs[0];
            const event_signature = web3.utils.keccak256('Mint(address,uint256,address,uint256,address)').toLowerCase();
            const issuer_address = `0x000000000000000000000000${event.address.slice(2)}`.toLowerCase();
            const token_id = '0x0000000000000000000000000000000000000000000000000000000000000001';
            const owner = `0x000000000000000000000000${accounts[0].slice(2)}`.toLowerCase();
            const price = `00000000000000000000000000000000000000000000000000000000000003e8`.toLowerCase();
            const currency = `000000000000000000000000${ZEROS.slice(2)}`.toLowerCase();

            expect(event_solidity.topics[0]).to.equal(event_signature);
            expect(event_solidity.topics[1]).to.equal(issuer_address);
            expect(event_solidity.topics[2]).to.equal(token_id);
            expect(event_solidity.topics[3]).to.equal(owner);
            expect(event_solidity.data.slice(2, 2 + 64)).to.equal(price);
            expect(event_solidity.data.slice(2 + 64)).to.equal(currency);

            const issuer = await T721.getIssuer(1);
            expect(issuer).to.equal(event.address);
        });

        it(`[event.mint Z value 999] [revert]`, async () => {

            const event = events[event_names.MinterPayableFixed_MarketerDisabled_ApproverDisabled];

            return expect(event.mint({value: 999})).to.eventually.be.rejected;

        });

    });

    describe('[openSale]', () => {

        it(`[event.mint Z value 1000] [event.sell 1 2000 1HR] [isSaleOpen 1 == true] [event.getSellPrice 1 == 2000]`, async () => {

            const T721 = await instance(contract_name);
            const event = events[event_names.MinterPayableFixed_MarketerTester_ApproverDisabled];

            const end_time = Math.floor(Date.now() / 1000) * (60 * 60);
            await event.mint({value: 1000});
            const res = await event.sell(1, 2000, end_time);
            const event_solidity = res.receipt.rawLogs[0];
            const event_signature = web3.utils.keccak256('Sale(address,uint256,address,uint256)').toLowerCase();
            const issuer_address = `0x000000000000000000000000${event.address.slice(2)}`.toLowerCase();
            const token_id = '0x0000000000000000000000000000000000000000000000000000000000000001';

            expect(event_solidity.topics[0]).to.equal(event_signature);
            expect(event_solidity.topics[1]).to.equal(issuer_address);
            expect(event_solidity.topics[2]).to.equal(token_id);

            await expect(T721.isSaleOpen(1)).to.eventually.be.true;
            expect((await event.getSellPrice(1)).toNumber()).to.equal(2000);

            const end = await T721.getSaleEnd(1);
            expect(end.toNumber()).to.equal(end_time);

        });

        it(`[event.mint Z value 1000] [event.test_closeSale 1] [ revert ]`, async () => {

            const event = events[event_names.MinterPayableFixed_MarketerTester_ApproverDisabled];

            await event.mint({value: 1000});
            return expect(event.test_closeSale(1)).to.eventually.be.rejected;

        });

        it(`[event.mint Z value 1000] [event.sell 1 2000 1 HR] [isSaleOpen 1 == true] [event.test_closeSale 1] [isSaleOpen 1 == false]`, async () => {

            const T721 = await instance(contract_name);
            const event = events[event_names.MinterPayableFixed_MarketerTester_ApproverDisabled];

            await event.mint({value: 1000});
            await event.sell(1, 2000, Math.floor(Date.now() / 1000) * (60 * 60));

            await expect(T721.isSaleOpen(1)).to.eventually.be.true;

            const res = await event.test_closeSale(1);
            const event_solidity = res.receipt.rawLogs[0];
            const event_signature = web3.utils.keccak256('SaleClose(address,uint256,address)').toLowerCase();
            const issuer_address = `0x000000000000000000000000${event.address.slice(2)}`.toLowerCase();
            const token_id = '0x0000000000000000000000000000000000000000000000000000000000000001';

            expect(event_solidity.topics[0]).to.equal(event_signature);
            expect(event_solidity.topics[1]).to.equal(issuer_address);
            expect(event_solidity.topics[2]).to.equal(token_id);

            return expect(T721.isSaleOpen(1)).to.eventually.be.false;

        });

        it(`[event.mint Z value 1000] [event.sell 1 2000 1HR] [event.sell 1 2000] [revert]`, async () => {

            const event = events[event_names.MinterPayableFixed_MarketerTester_ApproverDisabled];

            await event.mint({value: 1000});
            await event.sell(1, 2000, Math.floor(Date.now() / 1000) * (60 * 60));
            return expect(event.sell(1, 2000, Math.floor(Date.now() / 1000) * (60 * 60))).to.eventually.be.rejected;

        });

        it(`[event.mint Z value 1000] [event.sell 1 2000 10SECINPAST] [revert]`, async () => {

            const event = events[event_names.MinterPayableFixed_MarketerTester_ApproverDisabled];

            await event.mint({value: 1000});
            return expect(event.sell(1, 2000, Math.floor(Date.now() / 1000) - 10)).to.eventually.be.rejected;

        });

        it(`[event.mint Z value 1000] [openSale 1 1HR] [revert]`, async () => {

            const T721 = await instance(contract_name);
            const event = events[event_names.MinterPayableFixed_MarketerTester_ApproverDisabled];

            await event.mint({value: 1000});
            return expect(T721.openSale(1, Math.floor(Date.now() / 1000) * (60 * 60))).to.eventually.be.rejected;

        });

        it(`[event.mint Z value 1000] [anottherEvent.sell 1 2000 1HR] [revert]`, async () => {

            const event = events[event_names.MinterPayableFixed_MarketerTester_ApproverDisabled];
            const anotherEvent = events[event_names.MinterPayableFixed_MarketerTester_ApproverTester];

            await event.mint({value: 1000});
            return expect(anotherEvent.sell(1, 2000, Math.floor(Date.now() / 1000) * (60 * 60))).to.eventually.be.rejected;

        });


    });

    describe('[buy]', () => {

        it(`[event.mint Z value 1000] [event.sell 1 2000 1000] [event.buy 1 from One value 2000]`, async () => {

            const T721 = await instance(contract_name);
            const event = events[event_names.MinterPayableFixed_MarketerTester_ApproverDisabled];

            await event.mint({value: 1000});
            await event.sell(1, 2000, Math.floor(Date.now() / 1000) * (60 * 60));
            const res = await event.buy(1, {from: accounts[1], value: 2000});
            const event_solidity = res.receipt.rawLogs[0];
            const event_signature = web3.utils.keccak256('Buy(address,uint256,address,address,uint256,address)').toLowerCase();
            const issuer_address = `0x000000000000000000000000${event.address.slice(2)}`.toLowerCase();
            const token_id = '0x0000000000000000000000000000000000000000000000000000000000000001';
            const new_owner = `0x000000000000000000000000${accounts[1].slice(2)}`.toLowerCase();
            const data = `0x000000000000000000000000${accounts[0].slice(2)}00000000000000000000000000000000000000000000000000000000000007d00000000000000000000000000000000000000000000000000000000000000000`;

            expect(event_solidity.topics[0]).to.equal(event_signature);
            expect(event_solidity.topics[1]).to.equal(issuer_address);
            expect(event_solidity.topics[2]).to.equal(token_id);
            expect(event_solidity.topics[3]).to.equal(new_owner);
            expect(event_solidity.data.toLowerCase()).to.equal(data.toLowerCase());

            return expect(T721.isSaleOpen(1)).to.eventually.be.false;

        });

        it(`[event.mint Z value 1000] [event.sell 1 2000 1000] [event.buy 1 from Z value 2000] [revert]`, async () => {

            const event = events[event_names.MinterPayableFixed_MarketerTester_ApproverDisabled];

            await event.mint({value: 1000});
            await event.sell(1, 2000, Math.floor(Date.now() / 1000) * (60 * 60));
            return expect(event.buy(1, {from: accounts[0], value: 2000})).to.eventually.be.rejected;

        });

        it(`[event.mint Z value 1000] [event.buy 1 from One value 2000] [revert]`, async () => {

            const event = events[event_names.MinterPayableFixed_MarketerTester_ApproverDisabled];

            await event.mint({value: 1000});
            return expect(event.buy(1, {from: accounts[1], value: 2000})).to.eventually.be.rejected;

        });

    });


});
