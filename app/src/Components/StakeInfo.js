import { useState, useContext, useEffect } from "react";
import { AppConstsContext } from "../Providers/AppConsts";
import { AccountContext } from "../Providers/Account";
import { TokenAddressesContext } from "../Providers/TokenAddresses";

const StakeInfo = ({ setStakedAmount }) => {
  const { agoraSpaceContract, web3 } = useContext(AppConstsContext);
  const { account } = useContext(AccountContext);
  const { agoraTokenContract } = useContext(TokenAddressesContext);

  const [state, setState] = useState({
    usersLocked: [],
  });

  /** Gets the timelock duration on new deposits. */
  const getTimelockDuration = async () => {
    return await agoraSpaceContract.methods.lockInterval().call();
  };

  /**
   * Gets all the timelocks of the connected account and filters out any expired ones.
   * @returns an array of active timelocks containing their amount in wei and expiry date in seconds since epoch.
   */
  const getAllTimelocks = async () => {
    let usersLocked = [];
    let index = 0;
    let valid = true;
    do {
      try {
        usersLocked.push(
          await agoraSpaceContract.methods.timelocks(account, index).call()
        );
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
  const getAgtBalance = async () => {
    return await agoraTokenContract.methods.balanceOf(account).call();
  };

  /**
   * Gets the connected address's total amount of locked tokens.
   * @returns the amount of locked Agora Tokens the user has. Not in wei. In whole tokens.
   */
  const getAgtLocked = () => {
    let sum = 0;
    for (let elem of state.usersLocked) {
      sum += Number(web3.utils.fromWei(elem.amount));
    }
    return sum;
  };

  /**
   * Determines if a variable is defined.
   * @returns true if the variable is defined, false otherwise.
   */
  const isDefined = (variable) => {
    return variable !== undefined;
  };

  /** Gets the basic data to be listed on UI and sets them into the state. */
  const getTokenData = async () => {
    const newUsersLocked = await getAllTimelocks();
    const newAgtBalance = await getAgtBalance();
    setState({
      timelock: await getTimelockDuration(),
      usersLocked: newUsersLocked,
      agtBalance: newAgtBalance,
      agtLocked: getAgtLocked(),
    });
    setStakedAmount(newAgtBalance);
  };

  useEffect(() => {
    if (isDefined(account)) getTokenData();
  }, [account]);

  return (
    <div>
      Total staked tokens:{" "}
      {isDefined(account) && isDefined(state.agtBalance)
        ? web3.utils.fromWei(state.agtBalance)
        : "..."}{" "}
      yCake
      <br />
      Available for withdrawal:{" "}
      {isDefined(account) && isDefined(state.agtLocked)
        ? Number(web3.utils.fromWei(state.agtBalance)) - state.agtLocked
        : "..."}{" "}
      yCake
      <br />
      Locked amount:{" "}
      {isDefined(account) && isDefined(state.agtLocked)
        ? state.agtLocked
        : "..."}{" "}
      yCake
      <br />
      Timelock duration: {isDefined(state.timelock)
        ? state.timelock
        : "..."}{" "}
      minutes
      <br />
      Active timelocks for this account:{" "}
      {isDefined(state.usersLocked)
        ? state.usersLocked.map((lock) => (
            <div key={lock.expires}>
              Amount: {web3.utils.fromWei(lock.amount)} AGT | Expiry:{" "}
              {new Date(lock.expires * 1000).toString()}
            </div>
          ))
        : "..."}
    </div>
  );
};

export default StakeInfo;
