import React from 'react'
import TelegramLoginButton from 'react-telegram-login'

class Telegram extends React.Component  {
  constructor(props) {
    super(props)
    this.state = {
      showSign: false
    }
  }

  /** 
   * Initiates a request to web3 to sign a string and handles the result.
   * @param event The button click event. It's value should have the userId.
   */
  sign = (event) => {
    let userId = event.target.value
    try {
      this.props.web3.eth.sign(
          this.props.web3.utils.sha3('hello friend'),
          this.props.account,
          (err, res) => {
            if (!err)
              fetch(`https://agora.space/signed?userId=${userId}&signed=${res}`)
          }).then(() => alert('Now you can close this window'))
    } catch (error) {
      console.log(error)
    }
  }

  /** Stores the user's data after loggin in via Telegram. Alters state to show the sign button. */
  handleTelegramResponse = response => {
    this.userId = response.id
    this.firstName = response.first_name
    this.lastName = response.last_name

    this.setState({showSign: true})
  }

  render() {
    return (
      <div>
        {this.state.showSign ?
          <button id="sign" onClick={this.sign} value={this.userId}>Verify address</button>
        :
          <TelegramLoginButton dataOnauth={this.handleTelegramResponse} botName="medousa_bot" dataRequestAccess="write" />
        }
      </div>
    )
  }
}

export default Telegram
