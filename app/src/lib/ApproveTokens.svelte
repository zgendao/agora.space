<script>
  import { account } from "../stores/account.js";
  import { tokensApproved, approveToken } from "../stores/tokens.js";
  import Loader from "tabler-icons-svelte/icons/Loader.svelte";

  let loading = false;

  const approveBoth = async () => {
    loading = true;
    approveToken($account.yCakeContract);
    await new Promise((resolve) => setTimeout(resolve, 690)); // Workaround for a Metamask bug
    approveToken(
      $account.agoraTokenContract,
      () => {
        loading = false;
        tokensApproved.triggerUpdate();
      },
      () => (loading = false)
    );
  };
</script>

<h3 class="mb-4 text-xl font-bold text-gray-900">Approve tokens</h3>
<p class="mb-6 font-medium text-gray-500">
  In order to be able to stake tokens, you need to approve the dApp to manage
  both your yCake tokens and your future Agora Tokens.
</p>
<button
  on:click={approveBoth}
  class="flex justify-center mt-8 uppercase align-center items-center w-full px-5 py-3 font-bold text-white bg-blue-600 border border-transparent rounded-full hover:bg-blue-500 focus-visible:ring focus:outline-none disabled:bg-blue-300 disabled:cursor-not-allowed"
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
