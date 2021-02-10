import React from 'react';

class StakeInfo extends React.Component  {
  constructor(props) {
    super(props);
    this.state = {};
  }

  /** Gets the timelock duration on new deposits. */
  getTimelockDuration = async () => {
    return await this.props.agoraSpaceContract.methods.lockInterval().call();
  }

  /**
   * Gets all the timelocks of the connected account and filters out any expired ones.
   * @returns an array of active timelocks containing their amount in wei and expiry date in seconds since epoch.
   */
  getAllTimelocks = async () => {
    let usersLocked = [];
    let index = 0;
    let valid = true;
    do {
      try {
      usersLocked.push(await this.props.agoraSpaceContract.methods.timelocks(this.props.account, index).call());
      index++;
      } catch (e) {
        valid = false;
      }
    } while (valid);
    let currentTime = new Date().getTime() / 1000;
    for(let i = 0; i < usersLocked.length; i++) {
      if (usersLocked[i].expires <= currentTime) {
        // Expired lock, remove it
        usersLocked[i] = usersLocked[usersLocked.length - 1];
        usersLocked.pop();
        i--; // a magic i-- adding this should solve the issues in the smart contract too
      }
    }
    return usersLocked;
  }

  /**
   * Gets the connected address's Agora Token balance. It also equals to the staked token amount.
   * @returns the amount of Agora Tokens the user has in wei.
   */
  getAgtBalance = async () => {
    return await this.props.agoraTokenContract.methods.balanceOf(this.props.account).call();
  }

  /**
   * Gets the connected address's total amount of locked tokens.
   * @returns the amount of locked Agora Tokens the user has in wei.
   */
  getAgtLocked = () => {
    let sum = 0;
    for (let elem in this.state.usersLocked)
      sum += Number(elem);
    return sum;
  }

  /**
   * Determines if a variable is defined.
   * @returns true if the variable is defined, false otherwise.
   */
  isDefined = (variable) => {
    return variable !== undefined;
  }

  /**
   * Gets the basic data to be listed on UI and sets them into the state.
   */
  getTokenData = async () => {
    this.setState({
      timelock: await this.getTimelockDuration(),
      usersLocked: await this.getAllTimelocks(),
      agtBalance: await this.getAgtBalance()
      },
      () => {
        this.setState({
          agtLocked: this.getAgtLocked()  // This needs to be run after getAllTimelocks, hence its called in the second parameter
        });
        this.props.stakedAmount(this.state.agtBalance);
      }
    );
  }

  componentDidMount() {
    if (this.isDefined(this.props.account))
      this.getTokenData();
  }
  
  componentDidUpdate(prevProps) {
    if (prevProps.account !== this.props.account && this.isDefined(this.props.account))
      this.getTokenData();
  }

  render() {
    return (
      <div>
        Total staked tokens: {
          this.isDefined(this.props.account) && this.isDefined(this.state.agtBalance) ?
            this.props.web3.utils.fromWei(this.state.agtBalance.toString())
          :
            '...'
        } yCake<br/>
        Available for withdrawal: {
          this.isDefined(this.props.account) && this.isDefined(this.state.agtLocked) ?
            (this.state.agtBalance - this.state.agtLocked) / 10**18
          :
            '...'
        } yCake<br/>
        Locked amount: {
          this.isDefined(this.props.account) && this.isDefined(this.state.agtLocked) ?
            this.props.web3.utils.fromWei(this.state.agtLocked.toString())
          :
            '...'
        } yCake<br/>
        Timelock duration: {
          this.isDefined(this.state.timelock) ?
            this.state.timelock
          :
            '...'
        } minutes<br/>
        Active timelocks for this account: {
          this.isDefined(this.state.usersLocked) ?
            this.state.usersLocked.map(lock =>
              <div key={lock.expires}>
                Amount: {this.props.web3.utils.fromWei(lock.amount.toString())} AGT | Expiry: {new Date(lock.expires * 1000).toString()}
              </div>
            )
          :
            '...'
        }
      </div>
    );
  }
}

export default StakeInfo;
