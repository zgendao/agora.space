import { useState, useContext } from "react";
import { AppConstsContext } from "../Providers/AppConsts";
import { AccountContext } from "../Providers/Account";
import TelegramLoginButton from "react-telegram-login";

const Telegram = () => {
  const { web3 } = useContext(AppConstsContext);
  const { account } = useContext(AccountContext);

  const [showSign, setShowSign] = useState(false);
  const [userId, setUserId] = useState();

  /**
   * Initiates a request to web3 to sign a string and handles the result.
   */
  const sign = () => {
    try {
      web3.eth
        .sign(web3.utils.sha3("hello friend"), account, (err, res) => {
          if (!err)
            fetch(`https://agora.space/signed?userId=${userId}&signed=${res}`);
        })
        .then(() => alert("Now you can close this window"));
    } catch (error) {
      console.log(error);
    }
  };

  /** Stores the user's data after loggin in via Telegram. Alters state to show the sign button. */
  const handleTelegramResponse = (response) => {
    setUserId(response.id);
    // const firstName = response.first_name;
    // const lastName = response.last_name;

    setShowSign(true);
  };

  return (
    <div>
      {showSign ? (
        <button id="sign" onClick={sign}>
          Verify address
        </button>
      ) : (
        <TelegramLoginButton
          dataOnauth={handleTelegramResponse}
          botName="medousa_bot"
          dataRequestAccess="write"
        />
      )}
    </div>
  );
};

export default Telegram;
