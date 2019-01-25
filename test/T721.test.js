const {exec} = require('child_process');
const {snapshot, update_config, session, revert, NET, push, remove_config_update, instance, node_modules_path, signale} = require('./setup');

const chai = require('chai');
const chaiProm = require('chai-as-promised');
require('truffle-test-utils').init();

chai.use(chaiProm);

const expect = chai.expect;

const contract_name = 'T721V0';

let accounts = [];

const ERC165_interface = '0x01ffc9a7';
const ERC721Basic_interface = '0xcff9d6b4';
const ERC721Enumerable_interface = '0x780e9d63';
const ERC721Metadata_interface = '0x5b5e139f';

const ZEROS = '0x0000000000000000000000000000000000000000';

const createT721 = async () => {
    signale.info('Creating T721 proxy ...');
    return new Promise((ok, ko) => {
        exec(`${node_modules_path()}/.bin/zos create T721 --init initialize --args Test,TST --network ${NET.name}`, (err, stdout, stderr) => {
            if (err) {
                console.error(stderr);
                return ko(err);
            }
            signale.success('Created T721 proxy');
            ok();
        })
    })
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

const create = async () => {
    await createT721();
    await createTestERC721Receiver();
    await createBadTestERC721Receiver();
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
                await T721.mint(accounts[0]);
                expect((await T721.balanceOf(accounts[0])).toNumber())
                    .to.equal(1);

            });

            it('[balancOf Z] [mint Z] [mint Z] [mint Z] [transferFrom Z One 2] [balanceOf Z == 2]', async () => {

                const T721 = await instance(contract_name);

                await T721.mint(accounts[0]);
                await T721.mint(accounts[0]);
                await T721.mint(accounts[0]);

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
                await T721.mint(accounts[0]);
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
                await T721.mint(accounts[0]);
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
                await T721.mint(accounts[0]);
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
                await T721.mint(accounts[0]);
                return expect(T721.approve(ZEROS, 1)).to.eventually.be.rejected;

            });

            it(`[mint Z] [approve One 1 from Z] [getApproved 1 == One] [approve ${ZEROS} 1 from Z] [getApproved 1 == ${ZEROS}]`, async () => {

                const T721 = await instance(contract_name);
                await T721.mint(accounts[0]);
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
                await T721.mint(accounts[0]);
                return expect(T721.transferFrom(accounts[0], accounts[1], 1, {from: accounts[1]})).to.eventually.be.rejected;
            });

            it(`[mint Z] [transferFrom ${ZEROS} One 1 from Z] [revert]`, async () => {
                const T721 = await instance(contract_name);
                await T721.mint(accounts[0]);
                return expect(T721.transferFrom(ZEROS, accounts[1], 1)).to.eventually.be.rejected;
            });

            it(`[mint Z] [transferFrom Z ${ZEROS} 1 from Z] [revert]`, async () => {
                const T721 = await instance(contract_name);
                await T721.mint(accounts[0]);
                return expect(T721.transferFrom(accounts[0], ZEROS, 1)).to.eventually.be.rejected;
            });

            it(`[mint Z] [transferFrom One Z 1 from Z] [revert]`, async () => {
                const T721 = await instance(contract_name);
                await T721.mint(accounts[0]);
                return expect(T721.transferFrom(accounts[1], accounts[0], 1)).to.eventually.be.rejected;
            });

            it(`[mint Z] [transferFrom Z One 1 from Z] [balanceOf One == 1] [balanceOf Z == 0]`, async () => {
                const T721 = await instance(contract_name);
                await T721.mint(accounts[0]);

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
                await T721.mint(accounts[0]);
                await T721.approve(accounts[2], 1);
                await T721.transferFrom(accounts[0], accounts[1], 1, {from: accounts[2]});
                expect((await T721.balanceOf(accounts[1])).toNumber()).to.equal(1);
                expect((await T721.balanceOf(accounts[0])).toNumber()).to.equal(0);
                expect((await T721.getApproved(1))).to.equal(ZEROS);
            });

            it(`[mint Z] [setApprovalForAll Two true from Z] [transferFrom Z One 1 from Two] [balanceOf One == 1] [balanceOf Z == 0]`, async () => {
                const T721 = await instance(contract_name);
                await T721.mint(accounts[0]);
                await T721.setApprovalForAll(accounts[2], true);
                await T721.transferFrom(accounts[0], accounts[1], 1, {from: accounts[2]});
                expect((await T721.balanceOf(accounts[1])).toNumber()).to.equal(1);
                expect((await T721.balanceOf(accounts[0])).toNumber()).to.equal(0);
            });

        });

        describe('[safeTransferFrom] [mint balanceOf]', () => {

            it(`[mint Z] [safeTransferFrom Z TERCR 1 from Z] [balanceOf TERCR == 1] [balanceOf Z == 0] [TERCR.last_received_token == 1] [TERCR.last_received_data == null]`, async () => {
                const T721 = await instance(contract_name);
                await T721.mint(accounts[0]);

                await T721.methods['safeTransferFrom(address,address,uint256)'](accounts[0], testERC721Receiver.address, 1);
                expect((await T721.balanceOf(testERC721Receiver.address)).toNumber()).to.equal(1);
                expect((await T721.balanceOf(accounts[0])).toNumber()).to.equal(0);
                expect((await testERC721Receiver.last_received_token()).toNumber()).to.equal(1);
                expect(await testERC721Receiver.last_received_data()).to.equal(null);
            });

            it(`[mint Z] [safeTransferFrom Z BTERCR 1 from Z] [revert]`, async () => {
                const T721 = await instance(contract_name);
                await T721.mint(accounts[0]);

                return expect(T721.methods['safeTransferFrom(address,address,uint256)'](accounts[0], badTestERC721Receiver.address, 1)).to.eventually.be.rejected;
            });

            it(`[mint Z] [safeTransferFrom Z TERCR 1 "0xabcd" from Z] [balanceOf TERCR == 1] [balanceOf Z == 0] [TERCR.last_received_token == 1] [TERCR.last_received_data == 0xabcd]`, async () => {
                const T721 = await instance(contract_name);
                await T721.mint(accounts[0]);

                await T721.methods['safeTransferFrom(address,address,uint256,bytes)'](accounts[0], testERC721Receiver.address, 1, '0xabcd');
                expect((await T721.balanceOf(testERC721Receiver.address)).toNumber()).to.equal(1);
                expect((await T721.balanceOf(accounts[0])).toNumber()).to.equal(0);
                expect((await testERC721Receiver.last_received_token()).toNumber()).to.equal(1);
                expect(await testERC721Receiver.last_received_data()).to.equal('0xabcd');
            });

            it(`[mint Z] [safeTransferFrom Z BTERCR 1 "0xabcd" from Z] [revert]`, async () => {
                const T721 = await instance(contract_name);
                await T721.mint(accounts[0]);

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

                await T721.mint(accounts[0]);
                await T721.mint(accounts[1]);
                await T721.mint(accounts[2]);
                await T721.mint(accounts[3]);
                await T721.mint(accounts[4]);

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

                await T721.mint(accounts[0]);

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

                await T721.mint(accounts[0]);

                expect((await T721.tokenOfOwnerByIndex(accounts[0], 0)).toNumber()).to.equal(1);

            });

            it('[mint Z] [mint Z] [mint Z] [mint Z] [mint Z] [transferFrom Z Two 1 from Z] [balanceOf Z == 4] [tokenOfOwnerByIndex 1 == 3]', async () => {
                const T721 = await instance(contract_name);

                await T721.mint(accounts[0]);
                await T721.mint(accounts[0]);
                await T721.mint(accounts[0]);
                await T721.mint(accounts[0]);
                await T721.mint(accounts[0]);

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

                await T721.mint(accounts[0]);

                return expect(T721.tokenURI(1)).to.eventually.equal('');
            });

        });

    });

});
