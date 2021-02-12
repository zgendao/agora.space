# Agora Space web UI

# Initial setup
1. Create a file named *.env* in this directory (*/app*)
1. Open it, and specify the contract addresses the webapp will interact with.  
Example:  
`REACT_APP_YCAKE_ADDRESS = 0x28d4f491053f2d13145082418b93adce0a29023f`  
`REACT_APP_AGT_ADDRESS = 0x6d18cb6439fd7142bf7dae982b4431d5788b3642`  
`REACT_APP_AGORASPACE_ADDRESS = 0x4eF9e3A96B4d6d8d55c6a1a89BD3493Fc15f9D65`  
Where:  
    * `REACT_APP_YCAKE_ADDRESS` -> the address of the token that will be staked  
    * `REACT_APP_AGT_ADDRESS` -> the address of the token that will be given in return  
    * `REACT_APP_AGORASPACE_ADDRESS` -> the address of the Agora Space contract. This one won't change.
Change the addresses to the active addresses.  
NOTE: the above can be used for testing purposes on bsc testnet.
1. Open Terminal, if you haven't opened it yet.
1. Run `npm install`.

## Run the app
1. Open Terminal, if you haven't opened it yet.
1. Start the app via the command `npm start`.
1. The app will be started on the address specified in the terminal output. Probably it will be opened in your default browser automatically.