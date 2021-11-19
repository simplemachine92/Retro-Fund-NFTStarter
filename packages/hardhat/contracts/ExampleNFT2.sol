pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

// https://github.com/austintgriffith/scaffold-eth/tree/moonshot-bots-with-curve

//import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

//learn more: https://docs.openzeppelin.com/contracts/3.x/erc721

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two

contract ExampleNFT is ERC721Enumerable, Initializable, Ownable {

    address payable public constant recipient =
        payable(0x72Dc1B4d61A477782506186339eE7a897ba7d00A);

    
    uint256 public constant curve = 1030; // price increase 3% with each purchase
    uint256 public price = 0.0033 ether;


    uint256 public currentSupply = 0;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    string[] private uris;
    string private baseURI;
    uint256 private limit;
    string private inputName;
    string private inputSymbol;

     constructor(string memory _userBaseURI, string[] memory _uris, string memory _tokenName, string memory _abbreviation, uint256 _limit) ERC721(_tokenName, _abbreviation) {
        baseURI = _userBaseURI;
        uris = _uris;
        limit = _limit;
        inputName = _tokenName;
        inputSymbol = _abbreviation;
    } 

    function initializeExampleNFT(string memory _userBaseURI,string[] memory _uris, string memory _tokenName, string memory _abbreviation, uint256 _limit) public initializer {
        baseURI = _userBaseURI;
        uris = _uris;
        limit = _limit;
        inputName = _tokenName;
        inputSymbol = _abbreviation;
    }

    function mintItem(address to) public payable returns (uint256) {
        require(_tokenIds.current() < limit, "DONE MINTING");
        require(msg.value >= price, "NOT ENOUGH");

        price = (price * curve) / 1000;
        currentSupply++;

        _tokenIds.increment();

        uint256 id = _tokenIds.current();
        _mint(to, id);

        (bool success, ) = recipient.call{value: msg.value}("");
        require(success, "could not send");

        return id;
    }

    /**
     * @notice Returns the baseURI
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return
            baseURI;
    }

    function name() public view virtual override(ERC721) returns (string memory) {
        return inputName;
    }

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function symbol() public view virtual override returns (string memory) {
        return inputSymbol;
    }

    /**
     * @notice Returns the token uri containing the metadata
     * @param tokenId nft id
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        require(tokenId < limit, "Nonexistent token");

        //string memory baseURI = _baseURI();
        return
            bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, uris[tokenId-1]))
                : "";
    }

    /**
     * @notice Returns current floor value
     */
    function floor() public view returns (uint256) {
        if (currentSupply == 0) {
            return address(this).balance;
        }
        return address(this).balance / currentSupply;
    }

    /**
     * @notice Executes a sale and updates the floor price
     * @param _id nft id
     */
    function redeem(uint256 _id) external {
        require(ownerOf(_id) == msg.sender, "Not Owner");
        uint256 currentFloor = floor();
        require(currentFloor > 0, "sale cannot be made until floor is established");
        currentSupply--;
        super._burn(_id);
        (bool success, ) = msg.sender.call{value: currentFloor}("");
        require(success, "sending floor price failed");
    }

    /**
     * @notice For accepting eth
     */
    receive() external payable {}
}
