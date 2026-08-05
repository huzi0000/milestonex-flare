// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IMilestoneFunding} from "./interfaces/IMilestoneFunding.sol";

/// @title MilestoneX EIP-712 funding forwarder
/// @notice Lets a relayer fund an escrow project for a client who signed an
///         off-chain authorization. The client must first approve the escrow
///         contract to transfer the quoted FXRP amount.
contract MilestoneFundingForwarder is EIP712, ReentrancyGuard {
    bytes32 public constant FUND_PROJECT_TYPEHASH = keccak256(
        "FundProject(address escrow,address client,uint256 projectId,uint256 maximumFxrpAmount,uint256 nonce,uint256 deadline)"
    );

    mapping(address client => uint256 nonce) public nonces;

    error InvalidAddress();
    error ExpiredAuthorization();
    error InvalidSigner();

    event ProjectFundingRelayed(
        address indexed escrow,
        address indexed client,
        uint256 indexed projectId,
        uint256 fundedAmount,
        uint256 nonce,
        address relayer
    );

    constructor() EIP712("MilestoneXFundingForwarder", "1") {}

    function executeFunding(
        address escrow,
        address client,
        uint256 projectId,
        uint256 maximumFxrpAmount,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant returns (uint256 fundedAmount) {
        if (escrow == address(0) || client == address(0)) revert InvalidAddress();
        if (block.timestamp > deadline) revert ExpiredAuthorization();

        uint256 nonce = nonces[client];
        bytes32 structHash = keccak256(
            abi.encode(
                FUND_PROJECT_TYPEHASH,
                escrow,
                client,
                projectId,
                maximumFxrpAmount,
                nonce,
                deadline
            )
        );
        address signer = ECDSA.recover(_hashTypedDataV4(structHash), signature);
        if (signer != client) revert InvalidSigner();

        // Increment before the external call. A revert rolls this change back.
        nonces[client] = nonce + 1;
        fundedAmount = IMilestoneFunding(escrow).fundProjectFor(
            projectId,
            client,
            maximumFxrpAmount
        );

        emit ProjectFundingRelayed(
            escrow,
            client,
            projectId,
            fundedAmount,
            nonce,
            msg.sender
        );
    }
}
