const fs = require('fs');
const path = require('path');
const signale = require('signale');
const {from_current} = require('../../tasks/misc');
const {Portalize} = require('portalize');

let arg_idx = 1;

const GENERIC = '/// This contract has been automatically generated by combining the following 3 event plugs\n';
const INDENT = '        ';

const requirements = require('../../event_plugin_compatibility');

const report = {};

const process_args = (args, file_type) => {
    if (args === '') return [];
    return args.split(',').map(arg => {
        const splitter = arg.split(' ');
        const name = `${file_type}_${splitter[0]}`;
        const type = splitter.slice(1).join(' ');
        ++arg_idx;
        return {
            type,
            name
        }
    })
};

const load_dir = (dir_path, type) => {
    const complete_dir_path = path.join(from_current('./contracts'), dir_path);
    const files = fs.readdirSync(complete_dir_path);
    const ret = [];
    for (const file of files) {
        const content = fs.readFileSync(path.join(complete_dir_path, file));
        const header_start = content.indexOf('!@!') + 3;
        const header_end = content.lastIndexOf('!@!');

        if (header_start === 2 || header_end === -1) {
            throw new Error('Invalid Event plug, missing header !@! name:symbol:t721_ver:solidity_ver:build_args:args !@!');
        }

        const raw_header = content.slice(header_start, header_end);
        const header = raw_header.toString().trim().split(':');

        if (header.length !== 6) {
            throw new Error('Invalid Event plug, incomplete header !@! name:symbol:t721_ver:solidity_ver:build_args:args !@!');
        }

        ret.push({
            name: header[0],
            path: '../' + path.join(dir_path, file),
            sources: fs.readFileSync(from_current(path.join('./contracts/', dir_path, file))).toString(),
            symbol: header[1],
            t721_version: header[2],
            solidity_version: header[3],
            build_args: process_args(header[4], type),
            action_args: process_args(header[5], type),
            raw: `/// ${header[0]} ${header[1]}, build_args: [${header[4]}], action_args: [${header[5]}], t721_version: ${header[2]}, solidity_version: ${header[3]}`
        })
    }

    return ret;
};

let approvers = [];
let minters = [];
let marketers = [];
let event = "";
let combinations = [];

const create_combinations = () => {

    for (const minter of minters) {
        for (const marketer of marketers) {
            for (const approver of approvers) {

                if (requirements[minter.symbol]) {
                    if (requirements[minter.symbol].indexOf(marketer.symbol) === -1) continue;
                    if (requirements[minter.symbol].indexOf(approver.symbol) === -1) continue;
                }

                if (requirements[marketer.symbol]) {
                    if (requirements[marketer.symbol].indexOf(minter.symbol) === -1) continue;
                    if (requirements[marketer.symbol].indexOf(approver.symbol) === -1) continue;
                }

                if (requirements[approver.symbol]) {
                    if (requirements[approver.symbol].indexOf(marketer.symbol) === -1) continue;
                    if (requirements[approver.symbol].indexOf(minter.symbol) === -1) continue;
                }

                combinations.push({
                    minter,
                    marketer,
                    approver
                })
            }
        }
    }

};

const load_approvers = () => {
    approvers = load_dir('./approvers', 'approver');
};

const load_minters = () => {
    minters = load_dir('./minters', 'minter');
};

const load_marketers = () => {
    marketers = load_dir('./marketers', 'marketer');
};

const load_event = () => {
    event = fs.readFileSync(from_current('./events/Event.sol')).toString();
};

const check_plugs = (t721_ver, solidity_ver) => {

    const names = {};
    const symbols = {};

    const plugs = minters.concat(marketers).concat(approvers);

    for (const plug of plugs) {

        if (names[plug.name] === true) {
            throw new Error(`Invalid duplicate name ${plug.name} in ${plug.path}`)
        } else {
            names[plug.name] = true;
        }

        if (symbols[plug.symbol] === true)  {
            throw new Error(`Invalid duplicate symbol ${plug.symbol} in ${plug.path}`)
        } else {
            symbols[plug.symbol] = true;
        }

        if (plug.t721_version !== t721_ver) {
            throw new Error(`Invalid t721 version in ${plug.path}. Got ${plug.t721_version}, expected ${t721_ver}`)
        }

        if (plug.solidity_version !== solidity_ver) {
            throw new Error(`Invalid solidity version in ${plug.path}. Got ${plug.solidity_version}, expected ${solidity_ver}`)
        }

    }

};

const get_build_args = (minter, marketer, approver) => {
    let first = {
        global: true,
        minter: true,
        marketer: true,
        approver: true
    };

    let configure_args = {
        minter_call: '',
        marketer_call: '',
        approver_call: '',
        global: '',
        init: ''
    };

    for (const mint_args of minter.build_args) {

        if (!first.global) {
            configure_args.global += ',';
        } else {
            first.global = false;
        }
        configure_args.global += mint_args.type;

        if (!first.minter) {
            configure_args.minter_call += ','
        } else {
            first.minter = false;
        }
        configure_args.minter_call += mint_args.name;

        configure_args.init += `, ${mint_args.type} ${mint_args.name}`;
    }
    for (const market_args of marketer.build_args) {

        if (!first.global) {
            configure_args.global += ',';
        } else {
            first.global = false;
        }
        configure_args.global += market_args.type;

        if (!first.marketer) {
            configure_args.marketer_call += ','
        } else {
            first.marketer = false;
        }
        configure_args.marketer_call += market_args.name;

        configure_args.init += `, ${market_args.type} ${market_args.name}`;
    }
    for (const approve_args of approver.build_args) {

        if (!first.global) {
            configure_args.global += ',';
        } else {
            first.global = false;
        }
        configure_args.global += approve_args.type;

        if (!first.approver) {
            configure_args.approver += ','
        } else {
            first.approver = false;
        }
        configure_args.approver += approve_args.name;

        configure_args.init += `, ${approve_args.type} ${approve_args.name}`;
    }

    return {
        ...configure_args,
        global: `/// !@! ${configure_args.global} !@!`,
        minter_call: `${INDENT}configure_minter(${configure_args.minter_call});`,
        marketer_call: `${INDENT}configure_marketer(${configure_args.marketer_call});`,
        approver_call: `${INDENT}configure_approver(${configure_args.approver_call});`,
        inheritance: `${minter.name}, ${marketer.name}, ${approver.name}`,
        name: `_${minter.symbol}_${marketer.symbol}_${approver.symbol}`,
        desc: `${GENERIC}${minter.raw}\n${marketer.raw}\n${approver.raw}`,
        imports: `import "${minter.path}";\nimport "${marketer.path}";\nimport "${approver.path}";`
    };
};

const write_combinations = (t721_ver, solidity_ver) => {
    report.events = [];
    for (const combination of combinations) {

        const build_args = get_build_args(combination.minter, combination.marketer, combination.approver);

        const source = event
            .replace('/*$${{ARG_LIST}}$$*/', build_args.global)
            .replace('/*$${{DESCRIPTIONS}}$$*/', build_args.desc)
            .replace('/*$${{IMPORTS}}$$*/', build_args.imports)
            .replace('/*$${{NAME}}$$*/', build_args.name)
            .replace('/*$${{INHERITANCE}}$$*/', build_args.inheritance)
            .replace('/*$${INITIALIZER_ARGS}$$*/', build_args.init)
            .replace('/*$${INITIALIZER_BODY}$$*/', `${build_args.minter_call}\n${build_args.marketer_call}\n${build_args.approver_call}`)
            .replace('/*$${{SOLC_VERSION}}$$*/', solidity_ver)
            .replace('/*$${{SOLC_VERSION}}$$*/', solidity_ver)
            .replace('/*$${{T721_VERSION}}$$*/', t721_ver);

        fs.writeFileSync(from_current(`./contracts/events/Event${build_args.name}.sol`), source);

        report.events.push({
            name: `Event${build_args.name}`,
            solidity_version: solidity_ver,
            t721_version: t721_ver,
            sources: source,
            minter: combination.minter.name,
            marketer: combination.marketer.name,
            approver: combination.approver.name
        });
        signale.info(`Generated ./contracts/events/Event${build_args.name}.sol`);

    }
};

module.exports = async (t721_ver, solidity_ver) => {
    if (!fs.existsSync(from_current('./contracts/events'))) {
        fs.mkdirSync(from_current('./contracts/events'));
    }

    load_minters();
    report.minters = minters.map((minter) => ({
        name: minter.name,
        symbol: minter.symbol,
        t721_version: minter.t721_version,
        solidity_version: minter.solidity_version,
        build_args: minter.build_args,
        action_args: minter.action_args,
        sources: minter.sources
    }));

    load_marketers();
    report.marketers = marketers.map((marketer) => ({
        name: marketer.name,
        symbol: marketer.symbol,
        t721_version: marketer.t721_version,
        solidity_version: marketer.solidity_version,
        build_args: marketer.build_args,
        action_args: marketer.action_args,
        sources: marketer.sources
    }));

    load_approvers();
    report.approvers = approvers.map((approver) => ({
        name: approver.name,
        symbol: approver.symbol,
        t721_version: approver.t721_version,
        solidity_version: approver.solidity_version,
        build_args: approver.build_args,
        action_args: approver.action_args,
        sources: approver.sources
    }));

    load_event();

    check_plugs(t721_ver, solidity_ver);
    create_combinations();

    write_combinations(t721_ver, solidity_ver);

    if (!process.env.TESTING) {
        Portalize.get.setPortal(from_current('./portal'));
        Portalize.get.setModuleName('contracts');

        Portalize.get.add('event_infos.json', report);
    }

    signale.info(`Generated ${combinations.length} events`);
};
