import { readable } from "svelte/store";
import { ethers } from "ethers";
import agoraSpaceAbi from "../config/abi/agoraSpaceABI.json";
import erc20Abi from "../config/abi/erc20ABI.json";
import {
  AGORASPACE_ADDRESS,
  DAI_ADDRESS,
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

  const initContract = (address, abi) =>
    new ethers.Contract(address, abi, signer);

  const agoraSpaceContract = initContract(AGORASPACE_ADDRESS, agoraSpaceAbi);
  const DaiContract = initContract(DAI_ADDRESS, erc20Abi);
  const agoraTokenContract = initContract(AGT_ADDRESS, erc20Abi);

  set({
    provider,
    signer,
    address,
    agoraSpaceContract,
    DaiContract,
    agoraTokenContract,
  });
};
