# Agora Space smart contracts

The smart contracts in this repository are being used by [agora.space](https://agora.space). They provide a way to lock tokens for a period of time. Agora Tokens are minted in exchange for the deposited assets that can be swapped back again after their timelock has expired.  
A detailed article written about the timelock implementation is available [here](https://github.com/zgendao/agora.space/wiki/Timelock-implementation-possibilities-in-smart-contracts).

## Requirements

To run the project you need:

-   [Node.js 12.x](https://nodejs.org/download/release/latest-v12.x) development environment.
-   [Truffle](https://www.trufflesuite.com/truffle) for compiling and deploying.
-   (optional) Local [Ganache](https://www.trufflesuite.com/ganache) environment installed with `npm install -g ganache-cli` for local testing.
-   (optional) A file named `.mnemonic` in the root folder with your 12-word MetaMask seedphrase for deploying.
-   (optional) A file named `.infura` in the root folder with your [Infura](https://infura.io) project ID for deploying to Ethereum networks.

## Usage & deployment

Pull the repository from GitHub, then install its dependencies by executing this command:

```bash
npm install
```

Before deployment, you can rename the _AgoraSpace_ contract to include the accepted token's name or symbol. For WETH, the name could be AgoraWETHSpace.

Open _migrations/2_deploy_contracts.js_. Notice the top two constants:

```javascript
const stakeTokenAddress = "";
const returnTokenName = "Agora.space Token";
```

Edit them according to your needs.  
`stakeTokenAddress` is the address of the token to be staked.  
`returnTokenName` is the name of the token that will be given in return for staking. Conventionally, it should include the name or symbol of the stakeToken, e.g for WETH it should be Agora.space WETH Token.

To deploy the smart contracts to a network, replace _[name]_ in this command:

```bash
truffle migrate --network [name]
```

Note: networks can be configured in _truffle-config.js_. We've preconfigured the following:

-   `development` (for local testing)
-   `bsctest` (Binance Smart Chain Testnet)
-   `bsc` (Binance Smart Chain)
-   `ropsten` (Ropsten Ethereum Testnet)
-   `kovan` (Kovan Ethereum Testnet)
-   `ethereum` (Ethereum Mainnet)

Note2: the deployment script should automatically transfer the token's ownership to the AgoraSpace contract. If it fails to do so, it should be transferred manually.
