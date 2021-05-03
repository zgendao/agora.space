const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require("fs");
const mnemonic = fs.readFileSync(".mnemonic").toString().trim();
const infuraKey = fs.existsSync(".infura") ? fs.readFileSync(".infura").toString().trim() : undefined;

module.exports = {
    /**
     * Networks define how you connect to your ethereum client and let you set the
     * defaults web3 uses to send transactions.
     * You can ask a truffle command to use a specific network from the command line, e.g
     * $ truffle test --network <network-name>
     */

    networks: {
        // Useful for testing. The `development` name is special - truffle uses it by default
        // if it's defined here and no other network is specified at the command line.
        // You should run a client (like ganache-cli, geth or parity) in a separate terminal
        // tab if you use this network and you must also set the `host`, `port` and `network_id`
        // options below to some value.

        development: {
            host: "127.0.0.1", // Localhost (default: none)
            port: 8545, // Standard port (default: none)
            network_id: "*", // Any network (default: none)
        },
        bsctest: {
            provider: () => new HDWalletProvider(mnemonic, `https://data-seed-prebsc-1-s1.binance.org:8545`),
            network_id: 97,
            confirmations: 10,
            networkCheckTimeout: 5000,
            timeoutBlocks: 200,
            skipDryRun: true,
        },
        bsc: {
            provider: () => new HDWalletProvider(mnemonic, `https://bsc-dataseed1.binance.org`),
            network_id: 56,
            confirmations: 10,
            timeoutBlocks: 200,
            skipDryRun: true,
        },
        ropsten: {
            provider: () =>
                new HDWalletProvider({
                    mnemonic,
                    providerOrUrl: `wss://ropsten.infura.io/ws/v3/${infuraKey}`,
                    chainId: 3,
                }),
            network_id: 3, // Ropsten's id
            gas: 5500000, // Ropsten has a lower block limit than mainnet
            confirmations: 1, // # of confs to wait between deployments. (default: 0)
            networkCheckTimeout: 90000, // Seems like the default value was not enough
            timeoutBlocks: 200, // # of blocks before a deployment times out  (minimum/default: 50)
            skipDryRun: true, // Skip dry run before migrations? (default: false for public nets )
        },
        kovan: {
            provider: () =>
                new HDWalletProvider({
                    mnemonic,
                    providerOrUrl: `wss://kovan.infura.io/ws/v3/${infuraKey}`,
                    chainId: 42,
                }),
            network_id: 42,
            gas: 5500000,
            confirmations: 2,
            networkCheckTimeout: 90000,
            timeoutBlocks: 200,
            skipDryRun: true,
        },
        // For ethereum, gasPrice might need to be set manually
        ethereum: {
            provider: () =>
                new HDWalletProvider({
                    mnemonic,
                    providerOrUrl: `wss://mainnet.infura.io/ws/v3/${infuraKey}`,
                    chainId: 1,
                }),
            network_id: 1,
            gas: 4000000,
            confirmations: 2,
            networkCheckTimeout: 9000000,
            timeoutBlocks: 200,
            skipDryRun: true,
        },
    },

    // Set default mocha options here, use special reporters etc.
    mocha: {
        // timeout: 100000
    },

    // Configure your compilers
    compilers: {
        solc: {
            version: "0.8.3", // Fetch exact version from solc-bin (default: truffle's version)
            // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
            // settings: {          // See the solidity docs for advice about optimization and evmVersion
            //  optimizer: {
            //    enabled: false,
            //    runs: 200
            //  },
            //  evmVersion: "byzantium"
            // }
        },
    },
};
