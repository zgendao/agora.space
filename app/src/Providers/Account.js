import { createContext, useEffect, useState } from "react";

const AccountContext = createContext();

const AccountProvider = ({ children }) => {
  const [account, setAccount] = useState();

  const getAccount = async () => {
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
    } catch (error) {
      // User denied account access
      console.log(error);
      alert("Connect via MetaMask to be able to use this product.");
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      getAccount();
    } else {
      alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  }, []);

  return (
    <AccountContext.Provider
      value={{
        account,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export { AccountContext, AccountProvider };
