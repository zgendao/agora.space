// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "./BEP20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title Mintable BEP20 token
contract BEP20Mintable is BEP20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory name, string memory symbol)
    BEP20(name, symbol)
    {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
    }

    /// @notice Mint amount tokens to account account
    function mint(address account, uint256 amount) public {
        require(hasRole(MINTER_ROLE, _msgSender()));
        _mint(account, amount);
    }

    /// @notice Burn amount tokens from account account
    function burn(address account, uint256 amount) public {
        require(hasRole(MINTER_ROLE, _msgSender()));
        _burn(account, amount);
    }
}