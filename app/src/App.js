import { useState, useContext } from "react";
import { TokenAddressesContext } from "./Providers/TokenAddresses";
import TokenApprove from "./Components/TokenApprove";
import StakeSelector from "./Components/StakeSelector";
import StakeInfo from "./Components/StakeInfo";
import Telegram from "./Components/Telegram";

const App = () => {
  const { approvalNeeded } = useContext(TokenAddressesContext);

  const [stakedAmount, setStakedAmount] = useState();

  return (
    <div className="App">
      <header className="App-header">
        <h1>
          <b>How much do you want to stake?</b>
        </h1>
        <p>The more you stake, the more VIP group you can join.</p>
      </header>
      {approvalNeeded ? <TokenApprove /> : <StakeSelector />}
      {stakedAmount >= 100000000000000000n && <Telegram />}
      <StakeInfo setStakedAmount={setStakedAmount} />
    </div>
  );
};

export default App;
