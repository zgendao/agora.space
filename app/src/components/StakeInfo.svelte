<script>
  import { stakeInfo } from "../stores/stakeInfo.js";
  import { ethers } from "ethers";

  $: displayInfo = (key, label = "") =>
    $stakeInfo.loading ? "loading..." : $stakeInfo[key] + label;
</script>

<p>Total staked tokens: {displayInfo("total", "yCake")}</p>
<p>Available for withdrawal: {displayInfo("withdrawable", "yCake")}</p>
<p>Timelock duration: {displayInfo("timelockDuration")}</p>
<p>Active timelocks for this account:</p>
{#if $stakeInfo.loading}
  loading...
{:else}
  {#each $stakeInfo.timelocks as lock}
    <span>
      Amount: {ethers.utils.formatEther(lock.amount)} AGT | Expiry: {new Date(
        lock.expires * 1000
      ).toString()}
    </span>
  {/each}
{/if}
