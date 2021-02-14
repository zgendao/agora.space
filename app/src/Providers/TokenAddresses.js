import { useState, createContext, useContext, useEffect } from "react";
import { AppConstsContext } from "./AppConsts";
import { AccountContext } from "./Account";
import { bep20Abi } from "../abi/bep20ABI.js";

const TokenAddressesContext = createContext();

const TokenAddressesProvider = ({ children }) => {
  const { web3, agoraSpaceAddress, maxValue } = useContext(AppConstsContext);
  const { account } = useContext(AccountContext);

  const [approvalNeeded, setApprovalNeeded] = useState(true);

  const yCakeContract = new web3.eth.Contract(
    bep20Abi,
    process.env.REACT_APP_YCAKE_ADDRESS
  );
  const agoraTokenContract = new web3.eth.Contract(
    bep20Abi,
    process.env.REACT_APP_AGT_ADDRESS
  );

  /** Gets the connected address's allowance of the staked token. */
  const getTokenAllowance = async (tokenContract) => {
    return await tokenContract.methods
      .allowance(account, agoraSpaceAddress)
      .call();
  };

  /* Checks the allowances of both tokens.
   * TODO: probably this should be refactored to be able do determine if only one approve is needed.
   */
  const checkAllowances = async () => {
    if (
      (await getTokenAllowance(yCakeContract)) >= maxValue / 4n &&
      (await getTokenAllowance(agoraTokenContract)) >= maxValue / 4n
    ) {
      setApprovalNeeded(false);
    } else {
      setApprovalNeeded(true);
    }
  };

  // check if approvalNeeded can be set to false on mount
  useEffect(() => {
    if (account) checkAllowances();
  }, [account]);

  /** Approves the dApp to manage the users tokens to-be-staked/staked. */
  const approveToken = (tokenContract, tokenName) => {
    tokenContract.methods
      .approve(agoraSpaceAddress, maxValue)
      .send({ from: account, gas: 500000 })
      .then((value) => {
        alert(`The dApp is now able to manage your ${tokenName}`);
        checkAllowances();
      })
      .catch((err) => alert(err.message));
  };

  return (
    <TokenAddressesContext.Provider
      value={{
        yCakeContract,
        agoraTokenContract,
        approveToken,
        approvalNeeded,
        checkAllowances,
      }}
    >
      {children}
    </TokenAddressesContext.Provider>
  );
};

export { TokenAddressesContext, TokenAddressesProvider };
