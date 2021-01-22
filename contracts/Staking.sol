// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./token/IBEP20.sol";
import "./token/BEP20Mintable.sol";

/// @title A contract for staking tokens
contract Staking is Ownable {

    // Tokens managed by the contract
    IBEP20 internal stakedToken;
    BEP20Mintable internal returnToken;

    // For timelock
    struct locked {
        uint256 expires;
        uint256 amount;
    }
    mapping(address => locked[]) public timelocks;
    uint256 public lockInterval = 10;

    event Deposit(address account, uint256 amount);
    event Withdraw(address account, uint256 amount);

    constructor(address _stakedTokenAddress, address _returnTokenAddress) {
        stakedToken = IBEP20(_stakedTokenAddress);
        returnToken = BEP20Mintable(_returnTokenAddress);
    }

    /// @notice Accepts tokens, locks them and gives different tokens in return
    /// @dev For minting returnTokens, this contract should have MINTER_ROLE in it
    function deposit(uint256 _amount) public {
        require(_amount > 0, "Deposit amount non-positive");
        require(stakedToken.allowance(msg.sender, address(this)) >= _amount, "Allowance not sufficient");
        require(stakedToken.balanceOf(msg.sender) >= _amount, "Sender's balance not sufficient");
        stakedToken.transferFrom(msg.sender, address(this), _amount);
        returnToken.mint(msg.sender, _amount);
        locked memory timelockData;
        timelockData.expires = block.timestamp + lockInterval * 1 minutes;
        timelockData.amount = _amount;
        timelocks[msg.sender].push(timelockData);
        emit Deposit(msg.sender, _amount);
    }

    /// @notice If the timelock is expired, gives back the staked tokens in return for the tokens obtained while depositing
    /// @dev This contract should have sufficient allowance to be able to burn returnTokens from the user
    function withdraw(uint256 _amount) public {
        require(_amount > 0, "Withdraw amount non-positive");
        require(returnToken.allowance(msg.sender, address(this)) >= _amount, "returnToken allowance not sufficient");
        require(returnToken.balanceOf(msg.sender) - getLockedAmount(msg.sender) >= _amount, "Not enough unlocked tokens");
        returnToken.burn(msg.sender, _amount);
        stakedToken.transfer(msg.sender, _amount);
        emit Withdraw(msg.sender, _amount);
    }

    /// @notice Sets the timelock interval for new deposits
    function setLockInterval(uint256 _minutes) public onlyOwner {
        lockInterval = _minutes;
    }

    /// @notice Checks if the address has enough unlocked deposits 
    /// @dev Also deletes any expired lock data
    function getLockedAmount(address _investor) internal returns (uint256) {
        uint256 lockedAmount = 0;
        locked[] storage usersLocked = timelocks[_investor];    // storage ref -> we can modify members directly in the original array
        for(uint256 i = 0; i < usersLocked.length; i++) {
            if (usersLocked[i].expires <= block.timestamp) {
                // Expired locks, remove them
                usersLocked[i] = usersLocked[usersLocked.length - 1];
                usersLocked.pop();
            } else {
                // Still not expired, count it in
                lockedAmount += usersLocked[i].amount;
            }
        }
        return lockedAmount;
    }

}