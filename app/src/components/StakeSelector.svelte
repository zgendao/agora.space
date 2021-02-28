<script>
  import { ethers } from "ethers";
  import { account } from "../stores/account.js";
  import { stakeInfo } from "../stores/stakeInfo.js";

  let selectedAmount = 1;

  const transaction = (fn, action) => async() => {
    const amount = ethers.utils.parseEther(selectedAmount.toString());
    const tx = await fn(amount);
    tx.wait().then(() => {
      alert(`Successfully ${action} ${selectedAmount} yCake`);
      stakeInfo.triggerUpdate();
    })
  }

  const deposit = transaction($account.agoraSpaceContract.deposit, "staked");
  const withdraw = transaction($account.agoraSpaceContract.withdraw, "withdrawn");

</script>

<div>
  <label>
    <input type="radio" bind:group={selectedAmount} value={1} />
    1 yCake
  </label>

  <label>
    <input type="radio" bind:group={selectedAmount} value={10} />
    10 yCake
  </label>

  <label>
    <input type="radio" bind:group={selectedAmount} value={100} />
    100 yCake
  </label>
</div>
<button on:click={deposit}>Stake it</button>
<button on:click={withdraw}>Withdraw it</button>
