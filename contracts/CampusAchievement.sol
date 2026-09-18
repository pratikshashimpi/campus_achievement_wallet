// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CampusAchievement
 * @dev ERC-721 NFT contract for Campus Achievement Wallet
 *      Deployed on Base Sepolia | HackWithMumbai 3.0
 *      Gas-sponsored via UGF (Universal Gas Framework)
 */
contract CampusAchievement is ERC721, ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    Counters.Counter private _tokenIdCounter;

    // Achievement metadata stored on-chain
    struct Achievement {
        string title;
        string achievementType; // "certificate" | "badge" | "reward"
        string issuerName;
        string eventName;
        address studentAddress;
        uint256 issuedAt;
        bool verified;
    }

    mapping(uint256 => Achievement) public achievements;

    // Events
    event AchievementMinted(
        uint256 indexed tokenId,
        address indexed student,
        string title,
        string achievementType,
        string issuerName,
        uint256 timestamp
    );

    event AchievementVerified(uint256 indexed tokenId, address indexed verifier);

    constructor(address defaultAdmin) ERC721("CampusAchievement", "CAW") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
    }

    /**
     * @dev Mint a new NFT achievement (called by MINTER_ROLE or self-claim with open mint)
     * @param to Student wallet address
     * @param _tokenURI Base64-encoded JSON metadata URI
     * @param title Achievement title
     * @param achievementType Type: certificate, badge, reward
     * @param issuerName Name of issuing institution/teacher
     * @param eventName Name of event/course
     */
    function mintAchievement(
        address to,
        string memory _tokenURI,
        string memory title,
        string memory achievementType,
        string memory issuerName,
        string memory eventName
    ) public returns (uint256) {
        // For hackathon: allow open self-claim OR restrict to MINTER_ROLE
        // Using open mint for demo — can be restricted by uncommenting:
        // require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        achievements[tokenId] = Achievement({
            title: title,
            achievementType: achievementType,
            issuerName: issuerName,
            eventName: eventName,
            studentAddress: to,
            issuedAt: block.timestamp,
            verified: true
        });

        emit AchievementMinted(tokenId, to, title, achievementType, issuerName, block.timestamp);

        return tokenId;
    }

    /**
     * @dev Get achievement details for a tokenId
     */
    function getAchievement(uint256 tokenId) external view returns (Achievement memory) {
        require(_exists(tokenId), "Token does not exist");
        return achievements[tokenId];
    }

    /**
     * @dev Get total number of NFTs minted
     */
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Check if an address owns a specific achievement type
     */
    function hasAchievement(address student, string memory title) external view returns (bool, uint256) {
        uint256 total = _tokenIdCounter.current();
        for (uint256 i = 0; i < total; i++) {
            if (
                achievements[i].studentAddress == student &&
                keccak256(bytes(achievements[i].title)) == keccak256(bytes(title))
            ) {
                return (true, i);
            }
        }
        return (false, 0);
    }

    /**
     * @dev Add a new minter (admin only)
     */
    function addMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, minter);
    }

    // --- Required overrides ---

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    // Internal helper
    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
