const Web3 = require('web3');
const {Portalize} = require('portalize');
const {from_current} = require('./misc');
const {argv} = require('yargs');
const {exec} = require('child_process');
const signale = require('signale');

const createEvent = async (t721, price, cap, end, uri, net_name) => {
    signale.info('Deploying Event');
    return new Promise((ok, ko) => {
        exec(`${from_current('./node_modules')}/.bin/zos create Event_Mipafi_Mate_Apdi --init initialize --args ${t721},${price},${cap},${end},${uri} --network ${net_name}`, (err, stdout, stderr) => {
            if (err) {
                console.error(stderr);
                return ko(err);
            }
            stdout = stdout.replace('\n', '');
            signale.success(`Deployed Event ${stdout}`);
            ok(stdout);
        })
    })
};

const report = {};

module.exports.simulation = async function simulation(debug) {

    const current_dir = process.cwd();
    const contracts_dir = from_current('');
    process.chdir(contracts_dir);

    let {accounts, events, tickets, actions} = argv;

    if (accounts === undefined || events === undefined || tickets === undefined || actions === undefined) {
        throw new Error('Missing argument, usage: gulp contracts:simulation --accounts <count> --events <count> --tickets <count> --actions <count>');
    }

    accounts = parseInt(accounts);
    events = parseInt(events);
    tickets = parseInt(tickets);
    actions = parseInt(actions);

    report.args = {
        accounts,
        events,
        tickets,
        actions
    };

    Portalize.get.setPortal(from_current('./portal'));
    Portalize.get.setModuleName('contracts');

    const network_infos = Portalize.get.get('network.json', {module: 'network'});
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${network_infos.host}:${network_infos.port}`));

    const _accounts = (await web3.eth.getAccounts()).filter((address) => address !== network_infos.deployer);
    if (_accounts.length < accounts) {
        throw new Error(`Invalid number of accounts, available accounts => ${_accounts.length}`);
    }

    const AdministrationBoardArtifact = Portalize.get.get('AdministrationBoardV0.artifact.json');
    const EventManagersRegistryArtifact = Portalize.get.get('EventManagersRegistryV0.artifact.json');
    const EventRegistryArtifact = Portalize.get.get('EventRegistryV0.artifact.json');
    const T721Artifact = Portalize.get.get('T721V0.artifact.json');
    const EventArtifact = Portalize.get.get('EventV0_Mipafi_Mate_Apdi.artifact.json');

    const AdministrationBoard = new web3.eth.Contract(AdministrationBoardArtifact.abi, AdministrationBoardArtifact.networks[network_infos.network_id].address, {
        gas: 0xfffff
    });
    const EventManagersRegistry = new web3.eth.Contract(EventManagersRegistryArtifact.abi, EventManagersRegistryArtifact.networks[network_infos.network_id].address, {
        gas: 0xfffff
    });
    const EventRegistry = new web3.eth.Contract(EventRegistryArtifact.abi, EventRegistryArtifact.networks[network_infos.network_id].address, {
        gas: 0xfffff
    });
    const T721 = new web3.eth.Contract(T721Artifact.abi, T721Artifact.networks[network_infos.network_id].address, {
        gas: 0xfffff
    });

    const _events = [];

    let admin = null;

    for (let idx = 0; idx < accounts; ++idx) {
        const is_admin = await AdministrationBoard.methods.isMember(_accounts[idx]).call();

        if (is_admin) {
            admin = _accounts[idx];
            break ;
        }
    }
    if (admin === null) {
        throw new Error('No admins in default accounts, cannot add one');
    }

    let manager = null;

    for (let idx = 0; idx < accounts; ++idx) {
        const is_manager = await EventManagersRegistry.methods.isManager(_accounts[idx]).call();

        if (is_manager) {
            manager = _accounts[idx];
            break ;
        }
    }

    if (manager === null) {
        await EventManagersRegistry.methods.addManager(_accounts[0]).send({from: admin});
        manager = _accounts[0];
    }

    report.events = [];
    report.event_type = 'EventV0_Mipafi_Mate_Apdi';
    for (let idx = 0; idx < events; ++idx) {
        const address = await createEvent(T721.options.address, 10, 100000, 100000, 'lel', network_infos.type);
        report.events.push(address);
        _events.push(new web3.eth.Contract(EventArtifact.abi, address, {gas: 0xffffffffff}));
        await EventRegistry.methods.registerEvent(address).send({from: manager});
    }

    const _ticket_ownership = {};

    const _ticket_issuer = {};

    for (let idx = 0; idx < accounts; ++idx) {
        _ticket_ownership[_accounts[idx]] = [];
    }

    report.actions = [];

    for (let idx = 0; idx < events; ++idx) {
        for (let tick_idx = 0; tick_idx < tickets; ++tick_idx) {

            const selected_minter = _accounts[Math.floor(Math.random() * accounts)];

            signale.info(`[mint] ${selected_minter} mints on event ${idx}`);

            const ticket_count = parseInt(await T721.methods.balanceOf(selected_minter).call());

            await _events[idx].methods.mint().send({from: selected_minter, value: 100});

            const ticket_id = await T721.methods.tokenOfOwnerByIndex(selected_minter, ticket_count).call();

            report.actions.push({
                type: 'mint',
                by: selected_minter,
                to: _events[idx].options.address,
                id: parseInt(ticket_id)
            });

            signale.success(`[mint] ${selected_minter} minted ${ticket_id} on event ${idx}`);

            _ticket_issuer[ticket_id] = idx;

            _ticket_ownership[selected_minter].push(parseInt(ticket_id));


        }
    }

    const sell_list = [];
    const action_types = ['transfer', 'sell', 'buy', 'close_sale'];

    for (let idx = 0; idx < actions; ++idx) {

        let selected_account = null;
        let selected_action = null;
        while (selected_account === null || selected_action === null) {
            selected_account = _accounts[Math.floor(Math.random() * accounts)];

            if (_ticket_ownership[selected_account].length === 0) {
                selected_account = null;
            }

            selected_action = action_types[Math.floor(Math.random() * action_types.length)];

        }

        abort:
            switch (selected_action) {
                case 'transfer': {
                    const list_copy = [
                        ..._ticket_ownership[selected_account]
                    ];

                    let selected_id = null;
                    while (selected_id === null) {

                        if (list_copy.length === 0) {
                            --idx;
                            break abort;
                        }

                        selected_id = Math.floor(Math.random() * list_copy.length);
                        if (sell_list.indexOf(list_copy[selected_id]) !== -1) {
                            list_copy.splice(selected_id, 1);
                            selected_id = null;
                        } else {
                            selected_id = list_copy[selected_id];
                        }

                    }

                    let selected_target = null;
                    while (selected_target === null) {
                        selected_target = _accounts[Math.floor(Math.random() * accounts)];
                        if (selected_target === selected_account)
                            selected_target = null;
                    }

                    signale.info(`[${idx}][transfer] from: ${selected_account} to: ${selected_target} ticket: ${selected_id}`);

                    await T721.methods.transferFrom(selected_account, selected_target, selected_id).send({from: selected_account});

                    const current_idx = _ticket_ownership[selected_account].indexOf(selected_id);
                    _ticket_ownership[selected_target].push(_ticket_ownership[selected_account][current_idx]);
                    _ticket_ownership[selected_account].splice(current_idx, 1);

                    report.actions.push({
                        type: 'transfer',
                        by: selected_account,
                        to: selected_target,
                        id: selected_id
                    });
                    signale.success(`[${idx}][transfer] from: ${selected_account} to: ${selected_target} ticket: ${selected_id}`);
                }
                    break ;
                case 'sell': {
                    const list_copy = [
                        ..._ticket_ownership[selected_account]
                    ];

                    let selected_id = null;
                    while (selected_id === null) {

                        if (list_copy.length === 0) {
                            --idx;
                            break abort;
                        }

                        selected_id = Math.floor(Math.random() * list_copy.length);
                        if (sell_list.indexOf(list_copy[selected_id]) !== -1) {
                            list_copy.splice(selected_id, 1);
                            selected_id = null;
                        } else {
                            selected_id = list_copy[selected_id];
                        }
                    }

                    signale.info(`[${idx}][sell] from: ${selected_account} ticket: ${selected_id}`);

                    await _events[_ticket_issuer[selected_id]].methods.sell(selected_id, 100, 10000).send({
                        from: selected_account
                    });
                    sell_list.push(selected_id);

                    report.actions.push({
                        type: 'sell',
                        by: selected_account,
                        to: _events[_ticket_issuer[selected_id]].options.address,
                        id: selected_id
                    });
                    signale.success(`[${idx}][sell] from: ${selected_account} ticket: ${selected_id}`);

                }
                    break ;
                case 'buy': {

                    const list_copy = [
                        ...sell_list
                    ];

                    let selected_id = null;
                    while (selected_id === null) {

                        if (list_copy.length === 0) {
                            --idx;
                            break abort;
                        }

                        selected_id = Math.floor(Math.random() * list_copy.length);
                        if (_ticket_ownership[selected_account].indexOf(list_copy[selected_id]) !== -1) {
                            list_copy.splice(selected_id, 1);
                            selected_id = null;
                        } else {
                            selected_id = list_copy[selected_id];
                        }
                    }

                    signale.info(`[${idx}][buy] from: ${selected_account} ticket: ${selected_id}`);

                    await _events[_ticket_issuer[selected_id]].methods.buy(selected_id).send({
                        from: selected_account,
                        value: 100
                    });

                    const sell_list_idx = sell_list.indexOf(selected_id);
                    sell_list.splice(sell_list_idx, 1);

                    for (const account of Object.keys(_ticket_ownership)) {
                        if (_ticket_ownership[account].indexOf(selected_id) !== -1) {
                            _ticket_ownership[account].splice(_ticket_ownership[account].indexOf(selected_id), 1);
                        }
                    }
                    _ticket_ownership[selected_account].push(selected_id);

                    report.actions.push({
                        type: 'buy',
                        by: selected_account,
                        to: _events[_ticket_issuer[selected_id]].options.address,
                        id: selected_id
                    });
                    signale.success(`[${idx}][buy] from: ${selected_account} ticket: ${selected_id}`);


                }
                    break ;
                case 'close_sale': {

                    const list_copy = [
                        ...sell_list
                    ];

                    let selected_id = null;
                    while (selected_id === null) {

                        if (list_copy.length === 0) {
                            --idx;
                            break abort;
                        }

                        selected_id = Math.floor(Math.random() * list_copy.length);
                        if (_ticket_ownership[selected_account].indexOf(list_copy[selected_id]) === -1) {
                            list_copy.splice(selected_id, 1);
                            selected_id = null;
                        } else {
                            selected_id = list_copy[selected_id];
                        }
                    }

                    signale.info(`[${idx}][close_sale] from: ${selected_account} ticket: ${selected_id}`);

                    await _events[_ticket_issuer[selected_id]].methods.test_closeSale(selected_id).send({
                        from: selected_account
                    });

                    const sell_list_idx = sell_list.indexOf(selected_id);
                    sell_list.splice(sell_list_idx, 1);

                    report.actions.push({
                        type: 'buy',
                        by: selected_account,
                        to: _events[_ticket_issuer[selected_id]].options.address,
                        id: selected_id
                    });
                    signale.success(`[${idx}][close_sale] from: ${selected_account} ticket: ${selected_id}`);


                }
                    break ;
            }


    }

    report.owners = _ticket_ownership;
    report.sell_list = sell_list;

    try {
        const report = Portalize.get.get('report.json');
        signale.info('Overwritting previous report');
        Portalize.get.set('report.json', report);
    } catch (e) {
        Portalize.get.add('report.json', report);
    }

    signale.success('Written report');
    process.chdir(current_dir);
};