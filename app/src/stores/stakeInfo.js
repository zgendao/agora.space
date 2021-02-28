import { triggerableDerived } from "./utils/triggerableDerived";
import { account } from "./account.js";
import { ethers } from "ethers";

export const stakeInfo = triggerableDerived(
  account,
  async ([$account], set) => {
    set({ loading: true });
    const { address, agoraTokenContract, agoraSpaceContract } = $account;

    const timelocks = await getAllTimelocks(address, agoraSpaceContract);
    set({
      total: await getAgtBalance(address, agoraTokenContract),
      timelocks,
      withdrawable: getAgtLocked(timelocks, agoraTokenContract),
      timelockDuration: await getTimelockDuration(agoraSpaceContract),
      loading: false,
    });
  },
  {
    loading: true,
  }
);

/** Gets the timelock duration on new deposits. */
export const getTimelockDuration = async (agoraSpaceContract) => {
  return await agoraSpaceContract.lockInterval();
};

/**
 * Gets all the timelocks of the connected account and filters out any expired ones.
 * @returns an array of active timelocks containing their amount in wei and expiry date in seconds since epoch.
 */
export const getAllTimelocks = async (address, agoraSpaceContract) => {
  let usersLocked = [];
  let index = 0;
  let valid = true;
  do {
    try {
      usersLocked.push(await agoraSpaceContract.timelocks(address, index));
      index++;
    } catch (e) {
      valid = false;
    }
  } while (valid);
  let currentTime = new Date().getTime() / 1000;
  for (let i = 0; i < usersLocked.length; i++) {
    if (usersLocked[i].expires <= currentTime) {
      // Expired lock, remove it
      usersLocked[i] = usersLocked[usersLocked.length - 1];
      usersLocked.pop();
      i--; // a magic i-- adding this should solve the issues in the smart contract too
    }
  }
  return usersLocked;
};

/**
 * Gets the connected address's Agora Token balance. It also equals to the staked token amount.
 * @returns the amount of Agora Tokens the user has in wei.
 */
export const getAgtBalance = async (address, agoraTokenContract) => {
  const agtBalance = await agoraTokenContract.balanceOf(address);
  return ethers.utils.formatEther(agtBalance);
};

/**
 * Gets the connected address's total amount of locked tokens.
 * @returns the amount of locked Agora Tokens the user has. Not in wei. In whole tokens.
 */
export const getAgtLocked = (allTimelocks) => {
  let sum = 0;
  for (let elem of allTimelocks) {
    sum += Number(ethers.utils.formatEther(elem.amount));
  }
  return sum;
};
