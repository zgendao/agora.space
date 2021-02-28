<script>
  import { account } from "../stores/account.js";
  import { tokensApproved, approveToken } from "../stores/tokens.js";

  const approveBoth = async () => {
    approveToken($account.yCakeContract);
    await new Promise((resolve) => setTimeout(resolve, 690)); // Workaround for a Metamask bug
    approveToken($account.agoraTokenContract, () => {
      alert(`The dApp is now able to manage your yCake and AGT`);
      tokensApproved.triggerUpdate();
    });
  };
</script>

<div>
  <p>
    In order to be able to stake tokens, you need to approve the dApp to manage
    both your yCake tokens and your future Agora Tokens.
  </p>
  <button on:click={approveBoth}>Approve tokens</button>
</div>
