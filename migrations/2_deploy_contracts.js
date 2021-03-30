// Token properties
// NOTE: change them before deploying
const stakeTokenAddress = "";
const returnTokenName = "Agora.space Token";
const returnTokenSymbol = "AGT";

// Contracts
const staking = artifacts.require("AgorayCakeSpace");
const returnToken = artifacts.require("AgoraToken");

module.exports = async deployer  => {
  // Deploy the returnToken and then the staking contract
  await deployer.deploy(returnToken, returnTokenName, returnTokenSymbol);
  await deployer.deploy(staking, stakeTokenAddress, returnToken.address);

  // Transfer ownerShip of the token to the staking contract
  const tokenInstance = await returnToken.deployed();
  await tokenInstance.transferOwnership(staking.address);
  const newOwner = tokenInstance.owner();

  // Check if the ownership was transferred correctly
  newOwner == staking.address ?
  console.log("Ownership successfully transferred") :
  console.log("Ownership of the token contract should be transferred manually to the staking contract's address")
};