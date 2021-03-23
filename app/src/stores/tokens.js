import { triggerableDerived } from "./utils/triggerableDerived.js";
import { account } from "./account.js";
import { AGORASPACE_ADDRESS, MAX_VALUE } from "../config/constants.js";

export const tokensApproved = triggerableDerived(
  account,
  async ([$account], set) => {
    if (!$account) return;
    const { address, yCakeContract, agoraTokenContract } = $account;
    set(
      (await getTokenAllowance(address, yCakeContract)) &&
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
  tokenContract
    .approve(AGORASPACE_ADDRESS, MAX_VALUE)
    .then((value) => {
      successFn && successFn();
    })
    .catch(() => errorFn && errorFn());
};
