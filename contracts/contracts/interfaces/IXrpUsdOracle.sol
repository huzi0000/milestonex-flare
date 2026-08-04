// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @notice Minimal oracle surface used by MilestoneX.
interface IXrpUsdOracle {
    /// @return priceWei USD value of one XRP, scaled to 18 decimals.
    /// @return updatedAt Unix timestamp of the feed update.
    function latestPriceWei() external view returns (uint256 priceWei, uint64 updatedAt);
}
