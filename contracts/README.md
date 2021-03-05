# Agora Space smart contracts

The smart contracts in this repository are being used by [agora.space](https://agora.space). They provide a way to lock tokens for a period of time. Agora Tokens are minted in exchange for the deposited assets that can be swapped back again after their timelock has expired.  
A detailed article written about the timelock implementation is available [here](https://github.com/zgendao/agora.space/wiki/Timelock-implementation-possibilities-in-smart-contracts).

## Requirements

To run the project you need:

* [Node.js 12.x](https://nodejs.org/download/release/latest-v12.x/) development environment.
* [Truffle](https://www.trufflesuite.com/truffle) for compiling and deploying.
* (optional) Local [Ganache](https://www.trufflesuite.com/ganache) environment installed with `npm install -g ganache-cli` for local testing.
* (optional) A file named `.mnemonic` in the root folder of the repository (i.e. outside the *contracts* folder) with your 12-word MetaMask seedphrase for deploying.


## Usage

Pull the repository from GitHub, then install its dependencies by executing this command in the *contracts* folder:

```bash
npm install
```

To deploy the smart contracts to a network, replace *[name]* in this command:

```bash
truffle migrate --network [name]
```
Note: networks can be configured in *truffle-config.js*. We've preconfigured `development` (for local testing), `testnet` (Binance Smart Chain Testnet) and `bsc` (Binance Smart Chain).
