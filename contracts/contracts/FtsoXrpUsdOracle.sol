// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import {TestFtsoV2Interface} from "@flarenetwork/flare-periphery-contracts/coston2/TestFtsoV2Interface.sol";
import {IXrpUsdOracle} from "./interfaces/IXrpUsdOracle.sol";

/// @title FTSOv2 XRP/USD adapter for Coston2
/// @notice Exposes the Flare XRP/USD block-latency feed in a small interface
///         that can be mocked in local tests and consumed by MilestoneX.
contract FtsoXrpUsdOracle is IXrpUsdOracle {
    // Category 01 (crypto) + hex("XRP/USD") + zero padding to bytes21.
    bytes21 public constant XRP_USD_FEED_ID =
        0x015852502f55534400000000000000000000000000;

    function latestPriceWei()
        external
        view
        returns (uint256 priceWei, uint64 updatedAt)
    {
        TestFtsoV2Interface ftso = ContractRegistry.getTestFtsoV2();
        return ftso.getFeedByIdInWei(XRP_USD_FEED_ID);
    }
}
