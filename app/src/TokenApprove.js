import React from 'react';

class TokenApprove extends React.Component  {
  constructor(props) {
    super(props);
    this.state = {};
  }

  /** Approves the dApp to manage the users tokens to-be-staked/staked. */
  approveYCake = async () => {
    await this.props.yCakeContract.methods.approve(
        this.props.agoraSpaceAddress,
        this.props.maxValue
      ).send( {from : this.props.account, gas: 500000} )
      .then(value => {
        alert('The dApp is now able to manage your yCake');
        this.props.checkAllowances();
      })
      .catch(err => alert(err.message));
  }

  /** Approves the dApp to manage the users Agora Tokens. */
  approveAgt = async () => {
    await this.props.agoraTokenContract.methods.approve(
        this.props.agoraSpaceAddress,
        this.props.maxValue
      ).send( {from : this.props.account, gas: 500000} )
      .then(value => {
        alert('The dApp is now able to manage your AGT');
        this.props.checkAllowances();
      })
      .catch(err => alert(err.message));
  }

  /** Calls both approve functions one after the other. */
  approveBoth = async () => {
    this.approveYCake();
    await new Promise(resolve => setTimeout(resolve, 690)); // Workaround for a Metamask bug
    this.approveAgt();
  }

  render() {
    return (
      <div>
        <p>In order to be able to stake tokens, you need to approve the dApp to manage both your yCake tokens and your future Agora Tokens.</p>
        <button onClick={this.approveBoth}>Approve tokens</button>
      </div>
    );
  }
}

export default TokenApprove;
