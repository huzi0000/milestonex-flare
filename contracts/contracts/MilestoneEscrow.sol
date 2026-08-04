// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IXrpUsdOracle} from "./interfaces/IXrpUsdOracle.sol";

/// @title MilestoneX project escrow
/// @notice Holds FXRP for a USD-denominated project and releases it milestone by milestone.
/// @dev Prototype for Coston2. It does not provide legal arbitration or production custody guarantees.
contract MilestoneEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_MILESTONES = 12;
    uint256 public constant MAX_ORACLE_AGE = 15 minutes;

    enum ProjectStatus {
        None,
        Created,
        Funded,
        Completed,
        Cancelled
    }

    struct Project {
        address client;
        address contractor;
        bytes32 metadataHash;
        uint128 totalUsdCents;
        uint128 fundedFxrp;
        uint128 releasedFxrp;
        uint32 milestoneCount;
        uint32 nextMilestone;
        ProjectStatus status;
    }

    struct Milestone {
        uint128 usdCents;
        bytes32 evidenceHash;
        bool submitted;
        bool released;
    }

    IERC20 public immutable fxrp;
    IXrpUsdOracle public immutable xrpUsdOracle;
    address public immutable trustedForwarder;
    uint8 public immutable fxrpDecimals;
    uint256 public nextProjectId = 1;

    mapping(uint256 projectId => Project project) private projects;
    mapping(uint256 projectId => mapping(uint256 index => Milestone milestone))
        private milestones;
    mapping(uint256 projectId => mapping(address party => bool approved))
        public cancellationApprovals;

    error InvalidAddress();
    error InvalidMilestones();
    error InvalidStatus();
    error Unauthorized();
    error InvalidEvidence();
    error InvalidMilestoneOrder();
    error InvalidOraclePrice();
    error StaleOraclePrice();
    error SlippageExceeded(uint256 quoted, uint256 maximum);
    error AmountOverflow();

    event ProjectCreated(
        uint256 indexed projectId,
        address indexed client,
        address indexed contractor,
        uint256 totalUsdCents,
        bytes32 metadataHash
    );
    event ProjectFunded(
        uint256 indexed projectId,
        uint256 fxrpAmount,
        uint256 xrpUsdPriceWei
    );
    event EvidenceSubmitted(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        bytes32 evidenceHash
    );
    event MilestoneReleased(
        uint256 indexed projectId,
        uint256 indexed milestoneIndex,
        uint256 fxrpAmount
    );
    event CancellationApproved(uint256 indexed projectId, address indexed party);
    event ProjectCancelled(uint256 indexed projectId, uint256 refundedFxrp);
    event ProjectCompleted(uint256 indexed projectId);

    constructor(address fxrpToken, address oracle, address forwarder) {
        if (
            fxrpToken == address(0) ||
            oracle == address(0) ||
            forwarder == address(0)
        ) {
            revert InvalidAddress();
        }
        fxrp = IERC20(fxrpToken);
        xrpUsdOracle = IXrpUsdOracle(oracle);
        trustedForwarder = forwarder;
        fxrpDecimals = IERC20Metadata(fxrpToken).decimals();
    }

    function createProject(
        address contractor,
        bytes32 metadataHash,
        uint128[] calldata milestoneUsdCents
    ) external returns (uint256 projectId) {
        uint256 count = milestoneUsdCents.length;
        if (
            contractor == address(0) ||
            contractor == msg.sender ||
            metadataHash == bytes32(0)
        ) revert InvalidAddress();
        if (count == 0 || count > MAX_MILESTONES) revert InvalidMilestones();

        uint256 total;
        projectId = nextProjectId++;
        for (uint256 i; i < count; ++i) {
            uint128 amount = milestoneUsdCents[i];
            if (amount == 0) revert InvalidMilestones();
            total += amount;
            milestones[projectId][i].usdCents = amount;
        }
        if (total > type(uint128).max) revert AmountOverflow();

        projects[projectId] = Project({
            client: msg.sender,
            contractor: contractor,
            metadataHash: metadataHash,
            totalUsdCents: uint128(total),
            fundedFxrp: 0,
            releasedFxrp: 0,
            milestoneCount: uint32(count),
            nextMilestone: 0,
            status: ProjectStatus.Created
        });

        emit ProjectCreated(
            projectId,
            msg.sender,
            contractor,
            total,
            metadataHash
        );
    }

    /// @notice Returns the current amount of FXRP base units needed to fund a USD-cent amount.
    function quoteUsdCents(
        uint256 usdCents
    ) public view returns (uint256 fxrpAmount, uint256 xrpUsdPriceWei) {
        uint64 updatedAt;
        (xrpUsdPriceWei, updatedAt) = xrpUsdOracle.latestPriceWei();
        if (xrpUsdPriceWei == 0) revert InvalidOraclePrice();
        if (updatedAt > block.timestamp || block.timestamp - updatedAt > MAX_ORACLE_AGE) {
            revert StaleOraclePrice();
        }

        // USD cents -> FXRP base units, rounding up so the escrow is never underfunded.
        // fxrp = (usdCents / 100) / (USD per XRP)
        uint256 scale = 10 ** uint256(fxrpDecimals);
        fxrpAmount = Math.mulDiv(
            usdCents,
            scale * 1e18,
            100 * xrpUsdPriceWei,
            Math.Rounding.Ceil
        );
    }

    function fundProject(
        uint256 projectId,
        uint256 maximumFxrpAmount
    ) external nonReentrant returns (uint256 fundedAmount) {
        return _fundProject(projectId, msg.sender, maximumFxrpAmount);
    }

    /// @notice Trusted EIP-712 forwarder entry point for relayed funding.
    function fundProjectFor(
        uint256 projectId,
        address client,
        uint256 maximumFxrpAmount
    ) external nonReentrant returns (uint256 fundedAmount) {
        if (msg.sender != trustedForwarder) revert Unauthorized();
        return _fundProject(projectId, client, maximumFxrpAmount);
    }

    function _fundProject(
        uint256 projectId,
        address client,
        uint256 maximumFxrpAmount
    ) internal returns (uint256 fundedAmount) {
        Project storage project = projects[projectId];
        if (project.status != ProjectStatus.Created) revert InvalidStatus();
        if (client != project.client) revert Unauthorized();

        uint256 priceWei;
        (fundedAmount, priceWei) = quoteUsdCents(project.totalUsdCents);
        if (fundedAmount > maximumFxrpAmount) {
            revert SlippageExceeded(fundedAmount, maximumFxrpAmount);
        }
        if (fundedAmount > type(uint128).max) revert AmountOverflow();

        project.fundedFxrp = uint128(fundedAmount);
        project.status = ProjectStatus.Funded;
        fxrp.safeTransferFrom(client, address(this), fundedAmount);

        emit ProjectFunded(projectId, fundedAmount, priceWei);
    }

    function submitEvidence(
        uint256 projectId,
        uint256 milestoneIndex,
        bytes32 evidenceHash
    ) external {
        Project storage project = projects[projectId];
        if (project.status != ProjectStatus.Funded) revert InvalidStatus();
        if (msg.sender != project.contractor) revert Unauthorized();
        if (milestoneIndex != project.nextMilestone) revert InvalidMilestoneOrder();
        if (evidenceHash == bytes32(0)) revert InvalidEvidence();

        Milestone storage milestone = milestones[projectId][milestoneIndex];
        milestone.evidenceHash = evidenceHash;
        milestone.submitted = true;

        emit EvidenceSubmitted(projectId, milestoneIndex, evidenceHash);
    }

    function releaseMilestone(
        uint256 projectId,
        uint256 milestoneIndex
    ) external nonReentrant returns (uint256 releasedAmount) {
        Project storage project = projects[projectId];
        if (project.status != ProjectStatus.Funded) revert InvalidStatus();
        if (msg.sender != project.client) revert Unauthorized();
        if (milestoneIndex != project.nextMilestone) revert InvalidMilestoneOrder();

        Milestone storage milestone = milestones[projectId][milestoneIndex];
        if (!milestone.submitted || milestone.released) revert InvalidStatus();

        bool isLast = milestoneIndex + 1 == project.milestoneCount;
        if (isLast) {
            releasedAmount = project.fundedFxrp - project.releasedFxrp;
        } else {
            releasedAmount = Math.mulDiv(
                project.fundedFxrp,
                milestone.usdCents,
                project.totalUsdCents
            );
        }

        milestone.released = true;
        project.releasedFxrp += uint128(releasedAmount);
        project.nextMilestone += 1;
        fxrp.safeTransfer(project.contractor, releasedAmount);

        emit MilestoneReleased(projectId, milestoneIndex, releasedAmount);

        if (isLast) {
            project.status = ProjectStatus.Completed;
            emit ProjectCompleted(projectId);
        }
    }

    /// @notice Both parties must approve cancellation of a funded project.
    function approveCancellation(uint256 projectId) external nonReentrant {
        Project storage project = projects[projectId];
        if (project.status != ProjectStatus.Funded) revert InvalidStatus();
        if (msg.sender != project.client && msg.sender != project.contractor) {
            revert Unauthorized();
        }

        cancellationApprovals[projectId][msg.sender] = true;
        emit CancellationApproved(projectId, msg.sender);

        if (
            cancellationApprovals[projectId][project.client] &&
            cancellationApprovals[projectId][project.contractor]
        ) {
            uint256 refund = project.fundedFxrp - project.releasedFxrp;
            project.status = ProjectStatus.Cancelled;
            if (refund != 0) fxrp.safeTransfer(project.client, refund);
            emit ProjectCancelled(projectId, refund);
        }
    }

    function getProject(uint256 projectId) external view returns (Project memory) {
        return projects[projectId];
    }

    function getMilestone(
        uint256 projectId,
        uint256 milestoneIndex
    ) external view returns (Milestone memory) {
        return milestones[projectId][milestoneIndex];
    }
}
