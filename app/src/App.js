import React from 'react';
import Web3 from 'web3';
import TokenApprove from './TokenApprove';
import StakeSelector from './StakeSelector';
import StakeInfo from './StakeInfo';
import {bep20Abi} from './abi/bep20ABI.js';
import {agoraSpaceAbi} from './abi/agoraSpaceABI.js';
import Telegram from './Telegram';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      infoKey: Math.random(),
      web3: new Web3(window.ethereum)
    };
    this.agoraSpaceAddress = process.env.REACT_APP_AGORASPACE_ADDRESS;
    this.yCakeContract = new this.state.web3.eth.Contract(bep20Abi, process.env.REACT_APP_YCAKE_ADDRESS);
    this.agoraTokenContract = new this.state.web3.eth.Contract(bep20Abi, process.env.REACT_APP_AGT_ADDRESS);
    this.agoraSpaceContract = new this.state.web3.eth.Contract(agoraSpaceAbi, this.agoraSpaceAddress);
    this.maxValue = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;
  }

  getStakedAmount = (amount) => {
    this.setState({stakedAmount: amount});
  }

  /** Gets the connected address's allowance of the staked token. */
  getYCakeAllowance = async () => {
    return await this.yCakeContract.methods.allowance(this.state.account, this.agoraSpaceAddress).call();
  }

  /** Gets the connected address's allowance of Agora Token. */
  getAgtAllowance = async () => {
    return await this.agoraTokenContract.methods.allowance(this.state.account, this.agoraSpaceAddress).call();
  }

  /* Checks the allowances of both tokens.
   * TODO: probably this should be refactored to be able do determine if only one approve is needed.
   */
  checkAllowances = async () => {
    if (await this.getYCakeAllowance() >= this.maxValue / 4n && await this.getAgtAllowance() >= this.maxValue / 4n)
      this.setState({approvalNeeded: false});
    else
      this.setState({approvalNeeded: true});
  }

  /** Deposits the amount of Agora Tokens selected via the radio controls in StakeSelector. */
  deposit = async (amount) => {
    await this.agoraSpaceContract.methods.deposit(this.state.web3.utils.toWei(amount))
      .send( {from : this.state.account, gas: 500000} )
      .then(async value => {
        alert('Successfully staked ' + amount + ' yCake');
        await this.checkAllowances();
        // Update key to force out an update of the component
        this.setState({ infoKey: Math.random() });
      })
      .catch(err => alert(err.message));
  }

  /** Withdraws the amount of Agora Tokens selected via the radio controls in StakeSelector. */
  withdraw = async (amount) => {
    await this.agoraSpaceContract.methods.withdraw(this.state.web3.utils.toWei(amount))
      .send( {from : this.state.account, gas: 500000} )
      .then(async value => {
        alert('Successfully withdrawn ' + amount + ' yCake');
        await this.checkAllowances();
        // Update key to force out an update of the component
        this.setState({ infoKey: Math.random() });
      })
      .catch(err => alert(err.message));
  }

  /** Decides whether the TokenApprove or the StakeSelector component should be shown. */
  approveOrStake = () => {
    if (this.state.approvalNeeded)
      return (
        <TokenApprove
          account={this.state.account}
          yCakeContract={this.yCakeContract}
          agoraTokenContract={this.agoraTokenContract}
          agoraSpaceAddress={this.agoraSpaceAddress}
          maxValue={this.maxValue}
          checkAllowances={this.checkAllowances}
        />
      );
    return (
      <StakeSelector
        setDepositAmount={this.deposit}
        setWithdrawAmount={this.withdraw}
      />
    );
  }

  componentDidMount() {
    window.addEventListener('load', async () => {
      if (window.ethereum) {
        try {
          // Request account access
          this.accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
          this.setState({
            account: this.accounts[0]
          });
          this.checkAllowances();
        } catch (error) {
          // User denied account access
          console.log(error)
          alert('Connect via MetaMask to be able to use this product.');
        }
      }
      // Non-dapp browsers...
      else {
        alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
      }
    });
  }

  render() {
    return (<div className="App">
        <header className="App-header">
          <h1>
            <b>How much do you want to stake?</b>
          </h1>
          <p>
            The more you stake, the more VIP group you can join.
          </p>
        </header>
        {this.state.approvalNeeded !== undefined &&
          <this.approveOrStake/>
        }
        {this.state.stakedAmount >= 100000000000000000n &&
          <Telegram
            account={this.state.account}
            agoraTokenContract={this.agoraTokenContract}
            web3={this.state.web3}
          />
        }
        <StakeInfo
          key={this.state.infoKey}
          account={this.state.account}
          agoraTokenContract={this.agoraTokenContract}
          agoraSpaceContract={this.agoraSpaceContract}
          web3={this.state.web3}
          stakedAmount={this.getStakedAmount}
        />
      </div>
    )
  }
}

export default App;
