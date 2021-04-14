import { triggerableDerived } from "./utils/triggerableDerived.js";
import { account } from "./account.js";
import { AGORASPACE_ADDRESS, MAX_VALUE } from "../config/constants.js";

export const tokensApproved = triggerableDerived(
  account,
  async ([$account], set) => {
    if (!$account) return;
    const { address, DaiContract, agoraTokenContract } = $account;
    set(
      (await getTokenAllowance(address, DaiContract)) &&
        (await getTokenAllowance(address, agoraTokenContract))
    );
  },
  true
);

const getTokenAllowance = async (account, tokenContract) => {
  const allowance = await tokenContract.allowance(account, AGORASPACE_ADDRESS);
  return allowance >= MAX_VALUE / BigInt(4);
};

export const approveToken = async (tokenContract, successFn, errorFn) => {
  try {
    const tx = await tokenContract.approve(AGORASPACE_ADDRESS, MAX_VALUE);
    tx.wait().then(() => {
      successFn && successFn();
    });
  } catch {
    errorFn && errorFn();
  }
};
