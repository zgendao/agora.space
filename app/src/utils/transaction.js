import { stakeInfo } from "../stores/stakeInfo.js";
import { ethers } from "ethers";

export const transaction = async (fn, amount, successFn, errorFn) => {
  const weiAmount = ethers.utils.parseEther(amount.toString());
  try {
    const tx = await fn(weiAmount);
    tx.wait().then(() => {
      successFn(amount);
      stakeInfo.triggerUpdate();
    });
  } catch {
    errorFn();
  }
};
