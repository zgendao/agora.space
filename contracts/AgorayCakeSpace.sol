// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "./token/AgoraToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title A contract for staking tokens
contract AgorayCakeSpace is Ownable {

    // Tokens managed by the contract
    IERC20 internal stakeToken;
    AgoraToken internal returnToken;

    // For timelock
    struct LockedItem {
        uint256 expires;
        uint256 amount;
    }
    mapping(address => LockedItem[]) public timelocks;
    uint256 public lockInterval = 10;

    event Deposit(address account, uint256 amount);
    event Withdraw(address account, uint256 amount);

    /// @param _stakeTokenAddress The address of the token to be staked, that the contract accepts
    /// @param _returnTokenAddress The address of the token that's given in return
    constructor(address _stakeTokenAddress, address _returnTokenAddress) {
        stakeToken = IERC20(_stakeTokenAddress);
        returnToken = AgoraToken(_returnTokenAddress);
    }

    /// @notice Accepts tokens, locks them and gives different tokens in return
    /// @dev The depositor should approve the contract to manage stakingTokens
    /// @dev For minting returnTokens, this contract should have MINTER_ROLE
    /// @param _amount The amount to be deposited in the smallest unit of the token
    function deposit(uint256 _amount) external {
        require(_amount > 0, "Non-positive deposit amount");
        require(timelocks[msg.sender].length < 600, "Too many deposits without without checking the timelock entries");
        require(stakeToken.allowance(msg.sender, address(this)) >= _amount, "Allowance not sufficient");
        stakeToken.transferFrom(msg.sender, address(this), _amount);
        returnToken.mint(msg.sender, _amount);
        LockedItem memory timelockData;
        timelockData.expires = block.timestamp + lockInterval * 1 minutes;
        timelockData.amount = _amount;
        timelocks[msg.sender].push(timelockData);
        emit Deposit(msg.sender, _amount);
    }

    /// @notice If the timelock is expired, gives back the staked tokens in return for the tokens obtained while depositing
    /// @dev This contract should have sufficient allowance to be able to burn returnTokens from the user
    /// @dev For burning returnTokens, this contract should have MINTER_ROLE
    /// @param _amount The amount to be withdrawn in the smallest unit of the token
    function withdraw(uint256 _amount) external {
        require(_amount > 0, "Non-positive withdraw amount");
        require(returnToken.allowance(msg.sender, address(this)) >= _amount, "Token allowance not sufficient");
        require(returnToken.balanceOf(msg.sender) - getLockedAmount(msg.sender) >= _amount, "Not enough unlocked tokens");
        returnToken.burn(msg.sender, _amount);
        stakeToken.transfer(msg.sender, _amount);
        emit Withdraw(msg.sender, _amount);
    }

    /// @notice Sets the timelock interval for new deposits
    /// @param _minutes The desired interval in minutes
    function setLockInterval(uint256 _minutes) external onlyOwner {
        lockInterval = _minutes;
    }

    /// @notice Checks the amount of locked tokens for an account and deletes any expired lock data
    /// @param _investor The address whose tokens should be checked
    /// @return The amount of locked tokens
    function getLockedAmount(address _investor) public returns (uint256) {
        uint256 lockedAmount = 0;
        LockedItem[] storage usersLocked = timelocks[_investor];
        uint256 usersLockedLength = usersLocked.length;
        uint256 blockTimestamp = block.timestamp;
        for(uint256 i = 0; i < usersLockedLength; i++) {
            if (usersLocked[i].expires <= blockTimestamp) {
                // Expired locks, remove them
                usersLocked[i] = usersLocked[usersLockedLength - 1];
                usersLocked.pop();
                usersLockedLength--;
                i--;
            } else {
                // Still not expired, count it in
                lockedAmount += usersLocked[i].amount;
            }
        }
        return lockedAmount;
    }

}