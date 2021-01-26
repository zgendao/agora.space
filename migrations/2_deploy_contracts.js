// Token properties
// NOTE: change them before deploying
const stakeTokenAddress = "";
const returnTokenName = "Agora Token";
const returnTokenSymbol = "AGT";

// Contracts
const staking = artifacts.require("AgorayCakeSpace");
const returnToken = artifacts.require("AgoraToken");

// Deploy the returnToken and then the staking contract
module.exports = function(deployer) {
  deployer.deploy(returnToken, returnTokenName, returnTokenSymbol)
    .then(() => deployer.deploy(staking, stakeTokenAddress, returnToken.address));
};