// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Mintable BEP20 token used as return token for staking
contract AgoraToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory _name, string memory _symbol)
    ERC20(_name, _symbol)
    {
        // Initially, make the deployer the admin
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /// @notice Mints tokens to an account
    /// @param _account The address receiving the tokens
    /// @param _amount The amount of tokens to be minted
    function mint(address _account, uint256 _amount) external {
        require(hasRole(MINTER_ROLE, _msgSender()), "!minter");
        _mint(_account, _amount);
    }

    /// @notice Burns tokens from an account
    /// @param _account The address the tokens will be burnt from
    /// @param _amount The amount of tokens to be burned
    function burn(address _account, uint256 _amount) external {
        require(hasRole(MINTER_ROLE, _msgSender()), "!minter");
        _burn(_account, _amount);
    }
}