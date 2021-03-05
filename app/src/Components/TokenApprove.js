import { useContext } from "react";
import { TokenAddressesContext } from "../Providers/TokenAddresses";

const TokenApprove = () => {
  const { yCakeContract, agoraTokenContract, approveToken } = useContext(
    TokenAddressesContext
  );

  /** Calls both approve functions one after the other. */
  const approveBoth = async () => {
    approveToken(yCakeContract, "yCake");
    await new Promise((resolve) => setTimeout(resolve, 690)); // Workaround for a Metamask bug
    approveToken(agoraTokenContract, "AGT");
  };

  return (
    <div>
      <p>
        In order to be able to stake tokens, you need to approve the dApp to
        manage both your yCake tokens and your future Agora Tokens.
      </p>
      <button onClick={approveBoth}>Approve tokens</button>
    </div>
  );
};

export default TokenApprove;
