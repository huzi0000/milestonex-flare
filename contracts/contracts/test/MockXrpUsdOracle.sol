// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IXrpUsdOracle} from "../interfaces/IXrpUsdOracle.sol";

contract MockXrpUsdOracle is IXrpUsdOracle {
    uint256 public priceWei;
    uint64 public updatedAt;

    constructor(uint256 initialPriceWei) {
        setPrice(initialPriceWei);
    }

    function setPrice(uint256 newPriceWei) public {
        priceWei = newPriceWei;
        updatedAt = uint64(block.timestamp);
    }

    function setUpdatedAt(uint64 timestamp) external {
        updatedAt = timestamp;
    }

    function latestPriceWei() external view returns (uint256, uint64) {
        return (priceWei, updatedAt);
    }
}
