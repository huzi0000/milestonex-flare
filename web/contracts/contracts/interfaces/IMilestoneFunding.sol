// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @notice Surface called by the MilestoneX EIP-712 funding forwarder.
interface IMilestoneFunding {
    function fundProjectFor(
        uint256 projectId,
        address client,
        uint256 maximumFxrpAmount
    ) external returns (uint256 fundedAmount);
}
