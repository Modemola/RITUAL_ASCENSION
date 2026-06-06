// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract PassportNFT is ERC721URIStorage, AccessControl {
    bytes32 public constant BACKEND_OPERATOR = keccak256("BACKEND_OPERATOR");

    mapping(address => bool) public hasMinted;
    mapping(address => uint256) public tokenOfOwner;
    mapping(uint256 => uint8) public passportClass;
    mapping(uint256 => uint8) public passportStage;
    mapping(uint256 => string) public metadataCID;
    mapping(uint256 => bytes32) public discordAccountHash;
    mapping(bytes32 => bool) public discordAccountLinked;

    uint256 private tokenIdCounter;

    event PassportMinted(address indexed owner, uint256 indexed tokenId, uint8 classId);
    event DiscordAccountLinked(address indexed owner, uint256 indexed tokenId, bytes32 indexed discordHash);
    event StageAdvanced(uint256 indexed tokenId, uint8 newStage, uint256 timestamp);

    constructor(address backendOperator) ERC721("Ritual Ascension Passport", "RAP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BACKEND_OPERATOR, backendOperator);
    }

    function mintPassport(uint8 classId) external {
        require(!hasMinted[msg.sender], "Already minted");
        require(classId >= 1 && classId <= 5, "Invalid class");

        uint256 tokenId = ++tokenIdCounter;
        hasMinted[msg.sender] = true;
        tokenOfOwner[msg.sender] = tokenId;
        passportClass[tokenId] = classId;
        passportStage[tokenId] = 1;

        _safeMint(msg.sender, tokenId);
        emit PassportMinted(msg.sender, tokenId, classId);
    }

    function linkDiscordAccount(address wallet, bytes32 discordHash) external onlyRole(BACKEND_OPERATOR) {
        require(wallet != address(0), "Invalid wallet");
        require(hasMinted[wallet], "Missing passport");
        require(discordHash != bytes32(0), "Invalid Discord hash");

        uint256 tokenId = tokenOfOwner[wallet];
        require(ownerOf(tokenId) == wallet, "Wallet does not own passport");
        require(discordAccountHash[tokenId] == bytes32(0), "Discord already linked");
        require(!discordAccountLinked[discordHash], "Discord already claimed");

        discordAccountHash[tokenId] = discordHash;
        discordAccountLinked[discordHash] = true;

        emit DiscordAccountLinked(wallet, tokenId, discordHash);
    }

    function updateStage(uint256 tokenId, uint8 newStage) external onlyRole(BACKEND_OPERATOR) {
        require(_ownerOf(tokenId) != address(0), "Missing passport");
        require(newStage > passportStage[tokenId], "Stage can only advance");
        require(newStage <= 5, "Max stage is 5");

        passportStage[tokenId] = newStage;
        emit StageAdvanced(tokenId, newStage, block.timestamp);
    }

    function setMetadataCID(uint256 tokenId, string calldata cid) external onlyRole(BACKEND_OPERATOR) {
        require(_ownerOf(tokenId) != address(0), "Missing passport");
        metadataCID[tokenId] = cid;
        _setTokenURI(tokenId, string.concat("ipfs://", cid));
    }

    function transferFrom(address from, address to, uint256 tokenId) public pure override(ERC721, IERC721) {
        from;
        to;
        tokenId;
        revert("Passport is soulbound");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public pure override(ERC721, IERC721) {
        from;
        to;
        tokenId;
        data;
        revert("Passport is soulbound");
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
