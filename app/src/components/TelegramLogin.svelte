<script>
  import { ethers } from "ethers";
  import { account } from "../stores/account.js";  

  let userId = 1;

  function onTelegramAuth(user) {
    userId = user.id;
  }

  const sign = async (telegramUserId) => {
    const signature = await $account.signer.signMessage(ethers.utils.id("hello friend"));
    fetch(
      `https://agora.space/signed?userId=${telegramUserId}&signed=${signature}`
    ).then(() => alert("Now you can close this window"));
  };
</script>

<div>
  {#if userId}
    <button on:click={() => sign(userId)}>Verify address</button>
  {:else}
    <script
      async
      src="https://telegram.org/js/telegram-widget.js?14"
      data-telegram-login="medousa_bot"
      data-size="large"
      data-userpic="false"
      data-onauth="onTelegramAuth(user)"
      data-request-access="write"></script>
  {/if}
</div>
