<script>
  import { ethers } from "ethers";
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
        alert(`Successfully withdrawn ${amount} DAI`);
      },
      () => (loading = false)
    );
  };

  let userId = 0;
  window.onTelegramAuth = (user) => {
    userId = user.id;
  };
  const sign = async (telegramUserId) => {
    const signature = await $account.signer.signMessage(
      "hello friend"
    );
    fetch(
      `https://agora.space/signed?userId=${telegramUserId}&signed=${signature}`
    ).then(() => alert("Now you can close this window"));
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
    class="flex items-center justify-center w-full px-5 py-3 font-medium text-blue-600 bg-blue-100 border border-transparent rounded-full align-center hover:bg-blue-200 focus-visible:ring focus:outline-none"
  >
    Switch level
  </button> -->

  {#if userId}
    <button
      class="flex items-center justify-center w-full px-5 py-3 font-bold text-white uppercase bg-blue-600 border border-transparent rounded-full align-center hover:bg-blue-500 focus-visible:ring focus:outline-none disabled:bg-blue-300 disabled:cursor-not-allowed"
      on:click={() => sign(userId)}
    >
      Verify address
    </button>
  {:else}
    <div>
      <script
        async
        src="https://telegram.org/js/telegram-widget.js?14"
        data-telegram-login="medousa_bot"
        data-size="large"
        data-userpic="false"
        data-onauth="onTelegramAuth(user)"
        data-request-access="write"></script>
    </div>
  {/if}

  <button
    on:click={() => withdraw($stakeInfo["total"])}
    class="flex items-center justify-center w-full px-5 py-3 mt-4 font-bold text-blue-600 uppercase bg-blue-100 border border-transparent rounded-full align-center hover:bg-blue-200 focus-visible:ring focus:outline-none disabled:bg-blue-300 disabled:cursor-not-allowed"
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
