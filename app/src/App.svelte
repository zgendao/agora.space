<script>
  import Stake from "./lib/Stake.svelte";
  import Dashboard from "./lib/Dashboard.svelte";
  import ApproveTokens from "./lib/ApproveTokens.svelte";
  import { account } from "./stores/account.js";
  import { tokensApproved } from "./stores/tokens.js";
  import { stakeInfo } from "./stores/stakeInfo.js";
  import Lock from "tabler-icons-svelte/icons/Lock.svelte";
</script>

<main class="max-w-6xl px-4 mx-auto sm:px-6 lg:px-8">
  <div class="flex justify-between align-center">
    <h1 class="my-24 text-3xl font-extrabold text-gray-900 sm:text-5xl">
      {$stakeInfo.total
        ? "You're part of the yCake community ✨"
        : "Stake yCake to join the party"}
    </h1>
    <p
      class="my-auto font-medium transform translate-y-1 truncate max-w-[15rem] text-blue-500 px-5 py-2 bg-white rounded-full shadow-sm"
    >
      {$account ? `Connected as: ${$account.address}` : "Not connected"}
    </p>
  </div>
  <div class="flex relative justify-between bg-white shadow-md rounded-3xl">
    <div class="flex flex-col p-16 lg:w-[36rem]">
      {#if $account}
        {#if $tokensApproved}
          <h3 class="mb-4 text-xl font-bold text-gray-900">
            {$stakeInfo.total
              ? `You've staked ${$stakeInfo.total} yCake`
              : "How much do you want to stake?"}
          </h3>
          <p class="mb-6 font-medium text-gray-500">
            {$stakeInfo.total
              ? `If you don't want to be part of the community anymore, you can withdraw your funds.
                Medusa will kick you from the Telegram group immediately, but you will be able to stake again anytime.`
              : "The more you stake, the more VIP group you can join."}
          </p>
          {#if !$stakeInfo.total}
            <Stake />
          {:else}
            <Dashboard />
          {/if}
        {:else}
          <ApproveTokens />
        {/if}
      {:else}
        <h3 class="mb-4 text-xl font-bold text-gray-900">
          Connect with MetaMask to use the app
        </h3>
        <button
          class="flex my-auto items-center justify-center w-full min-w-xs px-5 py-3 uppercase font-bold text-white bg-blue-600 border border-transparent rounded-full hover:bg-blue-500 focus-visible:ring focus:outline-none"
          on:click={() => window.ethereum.enable()}
        >
          <span class="pr-4">
            <Lock />
          </span>Connect wallet</button
        >
      {/if}
    </div>
    <div class="hidden lg:block mt-auto">
      <img
        src="/img/composition_1.png"
        alt="Illustration"
        class="pt-14 pr-14 h-[400px]"
      />
    </div>
  </div>
</main>
