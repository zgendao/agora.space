// Token properties
// NOTE: change them before deploying
const stakeTokenAddress = "";
const returnTokenName = "Agora.space Token";
const returnTokenSymbol = "AGT";

// Contracts
const staking = artifacts.require("AgoraSpace");
const returnToken = artifacts.require("AgoraToken");

module.exports = async deployer  => {
  // Deploy the returnToken and then the staking contract
  await deployer.deploy(returnToken, returnTokenName, returnTokenSymbol);
  await deployer.deploy(staking, stakeTokenAddress, returnToken.address);

  // Transfer ownerShip of the token to the staking contract
  console.log("Transferring the token's ownership to the Agora Space contract...");
  const tokenInstance = await returnToken.deployed();
  await tokenInstance.transferOwnership(staking.address);
  const newOwner = tokenInstance.owner();
  console.log("Agora Token's ownership successfully transferred.");
};