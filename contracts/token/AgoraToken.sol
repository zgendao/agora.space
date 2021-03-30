// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title A mintable ERC20 token used by agora.space
contract AgoraToken is ERC20, Ownable {

    constructor(string memory _name, string memory _symbol)
    ERC20(_name, _symbol)
    {}

    /// @notice Mints tokens to an account
    /// @param _account The address receiving the tokens
    /// @param _amount The amount of tokens to be minted
    function mint(address _account, uint256 _amount) external onlyOwner {
        _mint(_account, _amount);
    }

    /// @notice Burns tokens from an account
    /// @param _account The address the tokens will be burnt from
    /// @param _amount The amount of tokens to be burned
    function burn(address _account, uint256 _amount) external onlyOwner {
        _burn(_account, _amount);
    }

}
