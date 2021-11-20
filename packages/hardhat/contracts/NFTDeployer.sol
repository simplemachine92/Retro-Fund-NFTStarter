// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

interface IExampleNFT {

    function mintItem(address to) external returns (uint256);

    function _baseURI() external view returns (string memory);
    
    function initializeExampleNFT(string memory _userBaseURI, string[] memory _uris, string memory _tokenName, string memory _abbreviation, uint256 _limit) external;
}

contract NFTDeployer {

  address public implementation;

  event Deployed(address _address, string _userBaseURI, string[] _uris, string _tokenName, string _abbreviation, uint256 _limit);

  constructor(address _implementation) {
    implementation = _implementation;
  }

  function deploy(string memory _userBaseURI, string[] memory _uris, string memory _tokenName, string memory _abbreviation, uint256 _limit) public returns (address) {

    // clone deterministically
    address deployment = Clones.cloneDeterministic(implementation, keccak256(abi.encode("1", _userBaseURI, _uris, _tokenName, _abbreviation, _limit)));

    IExampleNFT(deployment).initializeExampleNFT(_userBaseURI, _uris, _tokenName, _abbreviation, _limit);

    emit Deployed(deployment, _userBaseURI, _uris, _tokenName, _abbreviation, _limit);

    return deployment;

  }
}
