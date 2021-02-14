import { createContext } from "react";
import { agoraSpaceAbi } from "../abi/agoraSpaceABI.js";
import Web3 from "web3";

const AppConstsContext = createContext();

const AppConstsProvider = ({ children }) => {
  const web3 = new Web3(window.ethereum);
  const agoraSpaceAddress = process.env.REACT_APP_AGORASPACE_ADDRESS;
  const agoraSpaceContract = new web3.eth.Contract(
    agoraSpaceAbi,
    agoraSpaceAddress
  );
  const maxValue = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;

  return (
    <AppConstsContext.Provider
      value={{
        web3,
        agoraSpaceAddress,
        agoraSpaceContract,
        maxValue,
      }}
    >
      {children}
    </AppConstsContext.Provider>
  );
};

export { AppConstsContext, AppConstsProvider };
