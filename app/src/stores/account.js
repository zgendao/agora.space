import { readable } from "svelte/store";
import { ethers } from "ethers";
import agoraSpaceAbi from "../config/abi/agoraSpaceABI.json";
import bep20Abi from "../config/abi/bep20ABI.json";
import {
  AGORASPACE_ADDRESS,
  YCAKE_ADDRESS,
  AGT_ADDRESS,
} from "../config/constants.js";

export const account = readable(undefined, function start(set) {
  getAccount(set);
});

const getAccount = async (set) => {
  if (!window.ethereum)
    throw new Error("Please autorized browser extension (Metamask or similar)");
  window.ethereum.on("accountsChanged", () => getAccount(set));
  window.ethereum.on("chainChanged", () => getAccount(set));

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const address = await signer.getAddress();

  const initContract = (address, abi) => {
    return new ethers.Contract(address, abi, signer);
  };

  const agoraSpaceContract = initContract(AGORASPACE_ADDRESS, agoraSpaceAbi);
  const yCakeContract = initContract(YCAKE_ADDRESS, bep20Abi);
  const agoraTokenContract = initContract(AGT_ADDRESS, bep20Abi);

  set({
    provider,
    signer,
    address,
    agoraSpaceContract,
    yCakeContract,
    agoraTokenContract,
  });
};
