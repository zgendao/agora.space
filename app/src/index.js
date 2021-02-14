import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { AppConstsProvider } from "./Providers/AppConsts";
import { AccountProvider } from "./Providers/Account";
import { TokenAddressesProvider } from "./Providers/TokenAddresses";

ReactDOM.render(
  <React.StrictMode>
    <AppConstsProvider>
      <AccountProvider>
        <TokenAddressesProvider>
          <App />
        </TokenAddressesProvider>
      </AccountProvider>
    </AppConstsProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
