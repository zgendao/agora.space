import React from 'react';

class StakeSelector extends React.Component  {
  constructor(props) {
    super(props);
    this.state = {};
  }

  /** Updates state with the value selected on the radio controls. */
  onChangeValue = (event) => {
    this.setState({selectedAmount: event.target.value});
  }

  /** Sets the amount to be deposited and calls the deposit function in App. */
  deposit = (event) => {
    event.preventDefault();
    if (this.state.selectedAmount !== undefined)
      this.props.setDepositAmount(this.state.selectedAmount);
  }

  /** Sets the amount to be withdrawn and calls the withdraw function in App. */
  withdraw = (event) => {
    event.preventDefault();
    if (this.state.selectedAmount !== undefined)
      this.props.setWithdrawAmount(this.state.selectedAmount);
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div onChange={this.onChangeValue}>
          <input type="radio" id="ten" name="stakeAmount" value="10"/>
          <label htmlFor="ten">10 yCake</label>
          <input type="radio" id="hundert" name="stakeAmount" value="100"/>
          <label htmlFor="hundert">100 yCake</label>
          <input type="radio" id="thousand" name="stakeAmount" value="1000"/>
          <label htmlFor="thousand">1000 yCake</label>
        </div>
        <button onClick={this.deposit}>Stake it</button>
        <button onClick={this.withdraw}>Withdraw it</button>
      </form>
    );
  }
}

export default StakeSelector;
