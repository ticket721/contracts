# contracts
Ethereum Smart Contracts for ticket721

## Status

| Name | Shield |
| :---: | :----: |
| Travis | [![Build Status](https://travis-ci.org/ticket721/contracts.svg?branch=develop)](https://travis-ci.org/ticket721/contracts) |
| Codecov | [![codecov](https://codecov.io/gh/ticket721/contracts/branch/develop/graph/badge.svg)](https://codecov.io/gh/ticket721/contracts) |

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

