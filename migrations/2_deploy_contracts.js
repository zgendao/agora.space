// Token properties
// NOTE: change them before deploying
const stakeTokenAddress = "";
const returnTokenName = "aCake Token";
const returnTokenSymbol = "aCAKE";

// Contracts
const staking = artifacts.require("Staking");
const returnToken = artifacts.require("BEP20Mintable");

// Deploy the returnToken and then the staking contract
module.exports = function(deployer) {
  deployer.deploy(returnToken, returnTokenName, returnTokenSymbol)
    .then(() => deployer.deploy(staking, stakeTokenAddress, returnToken.address));
};