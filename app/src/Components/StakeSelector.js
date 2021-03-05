import { useState, useContext } from "react";
import { AppConstsContext } from "../Providers/AppConsts";
import { AccountContext } from "../Providers/Account";

const StakeSelector = () => {
  const { web3, agoraSpaceContract } = useContext(AppConstsContext);
  const { account } = useContext(AccountContext);

  const [selectedAmount, setSelectedAmount] = useState(1);

  /** Updates state with the value selected on the radio controls. */
  const onChangeValue = (event) => {
    setSelectedAmount(event.target.value);
  };

  /** Deposits the amount of Agora Tokens selected via the radio controls in StakeSelector. */
  const deposit = async () => {
    await agoraSpaceContract.methods
      .deposit(web3.utils.toWei(selectedAmount))
      .send({ from: account, gas: 500000 })
      .then(async (value) => {
        alert(`Successfully staked ${selectedAmount} yCake`);
      })
      .catch((err) => alert(err.message));
  };

  /** Withdraws the amount of Agora Tokens selected via the radio controls in StakeSelector. */
  const withdraw = async () => {
    await agoraSpaceContract.methods
      .withdraw(web3.utils.toWei(selectedAmount))
      .send({ from: account, gas: 500000 })
      .then(async (value) => {
        alert(`Successfully withdrawn ${selectedAmount} yCake`);
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div>
      <div onChange={onChangeValue}>
        <input type="radio" id="one" name="stakeAmount" value="1" />
        <label htmlFor="one">1 yCake</label>
        <input type="radio" id="ten" name="stakeAmount" value="10" />
        <label htmlFor="ten">10 yCake</label>
        <input type="radio" id="hundert" name="stakeAmount" value="100" />
        <label htmlFor="hundert">100 yCake</label>
      </div>
      <button onClick={deposit}>Stake it</button>
      <button onClick={withdraw}>Withdraw it</button>
    </div>
  );
};

export default StakeSelector;
