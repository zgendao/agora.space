<script>
  import { ethers } from "ethers";
  import { account } from "../stores/account.js";
  import ChevronRight from "tabler-icons-svelte/icons/ChevronRight.svelte";
  import Loader from "tabler-icons-svelte/icons/Loader.svelte";
  import { transaction } from "../utils/transaction.js";

  let loading = false;
  let selectedAmount = 1;
  const options = [1, 10, 100];

  const deposit = (amount) => {
    loading = true;
    transaction(
      $account.agoraSpaceContract.deposit,
      amount,
      async (amount) => {
        alert(`Successfully staked ${amount} DAI`);
        loading = false;
      },
      () => (loading = false)
    );
  };
</script>

<div class="flex w-full">
  {#each options as option}
    <label
      class={`px-8 py-3 border-black first:rounded-l-full last:rounded-r-full
              border-2 border-blue-600 font-bold first:border-r-0 last:border-l-0
              cursor-pointer transition flex-grow text-center ${
                selectedAmount === option
                  ? "bg-blue-600 hover:bg-blue-500 text-white border-transparent"
                  : "bg-blue-100 hover:bg-blue-200 text-blue-600"
              }`}
    >
      <input
        type="radio"
        bind:group={selectedAmount}
        value={option}
        class="hidden appearance-none"
      />
      {option} DAI
    </label>
  {/each}
</div>
<button
  on:click={() => deposit(selectedAmount)}
  class="flex items-center justify-center w-full px-5 py-3 mt-10 font-bold text-white uppercase bg-blue-600 border border-transparent rounded-full align-center hover:bg-blue-500 focus-visible:ring focus:outline-none"
  disabled={loading}
>
  {#if loading}
    <span class="animate-spin">
      <Loader />
    </span>
  {:else}
    Stake it
    <span class="pl-3">
      <ChevronRight />
    </span>
  {/if}
</button>
