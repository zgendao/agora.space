<script>
  import { stakeInfo, withdrawCountdown } from "../stores/stakeInfo.js";
  import { account } from "../stores/account.js";
  import Loader from "tabler-icons-svelte/icons/Loader.svelte";
  import { transaction } from "../utils/transaction.js";

  let loading = false;

  const withdraw = (amount) => {
    loading = true;
    transaction(
      $account.agoraSpaceContract.withdraw,
      amount,
      async (amount) => {
        alert(`Successfully withdrawn ${amount} yCake`);
      },
      () => (loading = false)
    );
  };
</script>

<div class="pt-6">
  {#if $withdrawCountdown}
    <p class="pb-6">
      Your assets are locked yet, you'll be able to withdraw them
      <span class="font-medium">
        {$withdrawCountdown +
          ($withdrawCountdown === 1 ? " minute" : " minutes")}
      </span>
      later.
    </p>
  {/if}
  <!--     <button
    on:click={withdraw}
    class="flex justify-center align-center items-center w-full px-5 py-3 font-medium text-blue-600 bg-blue-100 border border-transparent rounded-full hover:bg-blue-200 focus-visible:ring focus:outline-none"
  >
    Switch level
  </button> -->
  <button
    on:click={() => withdraw($stakeInfo["total"])}
    class="flex justify-center uppercase align-center items-center w-full px-5 py-3 font-bold text-white bg-blue-600 border border-transparent rounded-full hover:bg-blue-500 focus-visible:ring focus:outline-none disabled:bg-blue-300 disabled:cursor-not-allowed"
    disabled={$withdrawCountdown !== 0 || loading}
  >
    {#if loading}
      <span class="animate-spin">
        <Loader />
      </span>
    {:else}
      Withdraw
    {/if}
  </button>
</div>
