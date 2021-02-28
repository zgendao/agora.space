<script>
  import { account } from "./stores/account.js";
  import StakeSelector from "./components/StakeSelector.svelte";
  import StakeInfo from "./components/StakeInfo.svelte";
  import ApproveTokens from "./components/ApproveTokens.svelte";
  import TelegramLogin from "./components/TelegramLogin.svelte";
  import { tokensApproved } from "./stores/tokens.js";
</script>

<main>
  <h1>How much do you want to stake?</h1>
  <p>The more you stake, the more VIP group you can join.</p>

  {#if $account}
    {#if $tokensApproved}
      <StakeSelector />
      <StakeInfo />
    {:else}
      <ApproveTokens />
    {/if}
    <p>
      Selected account: {$account.address || "not defined"}
      <TelegramLogin />
    </p>
  {:else}
    <p>Not connected</p>
  {/if}
</main>