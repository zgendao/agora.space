<script>
  import { account } from "../stores/account.js";
  import { tokensApproved, approveToken } from "../stores/tokens.js";
  import Loader from "tabler-icons-svelte/icons/Loader.svelte";

  let loading = false;

  const approveBoth = async () => {
    loading = true;
    approveToken(
      $account.DaiContract,
      () =>
        approveToken(
          $account.agoraTokenContract,
          () => {
            loading = false;
            alert("Tokens successfully approved");
            tokensApproved.triggerUpdate();
          },
          () => (loading = false)
        ),
      () => (loading = false)
    );
  };
</script>

<h3 class="mb-4 text-xl font-bold text-gray-900">Approve tokens</h3>
<p class="mb-6 font-medium text-gray-500">
  In order to be able to stake tokens, you need to approve the dApp to manage
  both your DAI tokens and your future Agora Tokens.
</p>
<button
  on:click={approveBoth}
  class="flex items-center justify-center w-full px-5 py-3 mt-8 font-bold text-white uppercase bg-blue-600 border border-transparent rounded-full align-center hover:bg-blue-500 focus-visible:ring focus:outline-none disabled:bg-blue-300 disabled:cursor-not-allowed"
  disabled={loading}
>
  {#if loading}
    <span class="animate-spin">
      <Loader />
    </span>
  {:else}
    Approve tokens
  {/if}
</button>
