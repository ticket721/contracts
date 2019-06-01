# contracts
Ethereum Smart Contracts for ticket721

## Status

| Name | Shield |
| :---: | :----: |
| Travis | [![Build Status](https://travis-ci.org/ticket721/contracts.svg?branch=develop)](https://travis-ci.org/ticket721/contracts) |
| Coveralls | [![Coverage Status](https://coveralls.io/repos/github/ticket721/contracts/badge.svg?branch=develop)](https://coveralls.io/github/ticket721/contracts?branch=develop) |

## Env

| Variable | Mandatory | Values | Description |
| :---: | :---: | :---: | :---: |
| `T721_NETWORK` | yes | `test`, `local` | This value will tell every task how it should behave / configure the tools |

## Tasks

| Name | Description |
| :---: | :---------: |
| `contracts:configure` | Reads the configuration created by `network` and generates the `truffle-config.js` file |
| `contracts:compile` | Compiles smart contracts and generates artifacts |
| `contracts:push` | Push logics to the network with `zos` |
| `contracts:deploy` | Push and Deploys contracts to the network with `zos` |
| `contracts:clean` | Remove all generated configurations, build directory, clean module's portal |
| `contracts:simulation` | Deploys events, create tickets and makes actions to populate development node |

## Manually Deploying

Be sure to set `T721_NETWORK` to the correct value.
When running locally, the value should be `local`.
The commands assume you are deploying locally.

#### Requirements

You need to start the network with the appropriate `T721_NETWORK` value (should be the same as here).

#### Clean submodule

```shell
env T721_NETWORK=local gulp contracts:clean
```

#### Configure submodule

```shell
env T721_NETWORK=local gulp contracts:configure
```

#### Deploy contracts

```shell
env T721_NETWORK=local gulp contracts:deploy
```

After deployment, artifacts will be save in the portal at `contracts/`.

### Run simulation

You can run the simulation on the configured node to create events, tickets and make actions with the default accounts.
```shell
gulp contracts:simulation --accounts number_of_accounts_to_use --events number_of_events_to_create --tickets number_of_ticket_per_event_to_create --actions number_of_actions_to_run
```

## Tests

You don't need to run `start` on the network to run the test suite.

#### Tests without coverage

```shell
env T721_NETWORK=test gulp contracts:clean
env T721_NETWORK=test gulp contracts:configure
npm run test:mocha
```

#### Tests with coverage (very long)

```shell
env T721_NETWORK=test gulp contracts:clean
env T721_NETWORK=test gulp contracts:configure
npm run test:solidity-coverage
```

#### Deploying on ropsten

You should use the env's `gulp deploy_ropsten` task to do this

#### Scotch Section 
