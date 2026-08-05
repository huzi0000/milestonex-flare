# MilestoneX Contract Security Review

**Date:** 2026-08-05  
**Network target:** Flare Testnet Coston2  
**Scope:** `MilestoneEscrow.sol`, `MilestoneFundingForwarder.sol`, and `FtsoXrpUsdOracle.sol`  
**Status:** Hackathon prototype review—not a professional audit

## Summary

The contract suite compiles successfully and passes **18 automated tests** covering normal behavior, authorization failures, oracle safety, signature binding, multi-project accounting, rounding, partial release, cancellation, and replay resistance.

No known critical or high-severity issue was identified in the tested prototype flows. This statement is not an audit guarantee and must not be used to justify handling real funds.

## Security properties tested

| Property | Result |
|---|---|
| Constructor rejects zero dependencies | Pass |
| Invalid/self contractor rejected | Pass |
| Empty, zero-value, and excessive milestone arrays rejected | Pass |
| Zero, stale, and future oracle values rejected | Pass |
| FXRP quote rounds upward to prevent underfunding | Pass |
| Only project client can directly fund | Pass |
| Duplicate funding rejected | Pass |
| Slippage maximum enforced | Pass |
| Only contractor can submit evidence | Pass |
| Evidence must follow milestone order | Pass |
| Zero evidence hash rejected | Pass |
| Only client can release payment | Pass |
| Release requires submitted evidence | Pass |
| Multi-milestone proportional accounting is exact | Pass |
| Final milestone receives rounding remainder | Pass |
| Cancellation requires both parties | Pass |
| Partial release remains with contractor during cancellation | Pass |
| Only unreleased balance is refunded | Pass |
| Global escrow balance equals all unreleased obligations | Pass |
| Expired EIP-712 authorization rejected | Pass |
| Wrong signer rejected | Pass |
| Signature replay rejected | Pass |
| Signature binds escrow/client/project/amount/nonce/deadline/chain | Pass |

## Accounting invariant

At every tested state transition:

```text
escrow FXRP balance == Σ(fundedFxrp - releasedFxrp)
                         for every Funded project
```

The invariant was checked across two simultaneously funded projects while performing partial release, mutual cancellation, final release, and completion.

Additional assertions:

```text
releasedFxrp <= fundedFxrp
nextMilestone <= milestoneCount
Completed => releasedFxrp == fundedFxrp
Cancelled => escrow obligation == 0
```

## Access-control model

### Client

- Creates projects
- Funds directly
- Signs relayed funding authorization
- Releases submitted milestones
- Approves cancellation

### Contractor

- Submits evidence for the active milestone
- Approves cancellation
- Receives released FXRP

### Funding forwarder

- Can call `fundProjectFor`
- Must present a valid client EIP-712 signature
- Uses per-client nonces and deadlines
- Cannot alter signed project, amount, escrow, client, chain, or deadline

### Other accounts

- Cannot fund another client's project directly
- Cannot submit evidence
- Cannot release milestones
- Cannot approve cancellation

## Oracle controls

- Zero price is rejected
- Future timestamp is rejected
- Data older than 15 minutes is rejected
- Funding maximum protects the client from price movement between quote and execution
- USD-cent conversion rounds FXRP upward so escrow cannot be underfunded through integer truncation

## Design limitations and known risks

### 1. Testnet prototype only

The contracts have not received an independent professional audit. They must not hold mainnet or real-value funds.

### 2. No dispute arbitration

Milestone release requires client approval. MilestoneX does not currently arbitrate whether evidence satisfies offchain project terms.

### 3. Mutual-cancellation liveness

After funding, cancellation requires both parties. If one party disappears, funds can remain locked. A production design would require timeouts and a dispute path.

### 4. Evidence can be updated before release

The contractor can submit another evidence hash for the active, unreleased milestone. Every submission emits an event, preserving history, but the UI must show the latest value clearly. A production policy may freeze after first submission or version evidence explicitly.

### 5. ERC-20 approval lifecycle

Gas-abstracted funding still requires a prior FXRP allowance. The prototype approves a bounded amount with a small quote buffer; production UX should support allowance review and revocation.

### 6. Relayer availability

The EIP-712 forwarder is permissionless, but someone must submit and pay gas for the signed authorization. Direct client funding remains available if no relayer is online.

### 7. No upgradeability or administrator

The deployed contracts are intentionally non-upgradeable and have no owner override. Bugs cannot be patched in place, but no administrator can seize escrowed funds.

### 8. Metadata availability

Only metadata and evidence hashes are stored onchain. The corresponding offchain content must remain available and correctly linked.

## Automated test command

```bash
cd contracts
npm install
npm test
```

Expected result:

```text
MilestoneEscrow security and invariants: 12 passing
MilestoneEscrow core behavior:            6 passing
Total:                                   18 passing
```

## Files

- Core tests: `test/MilestoneEscrow.ts`
- Security/invariant tests: `test/MilestoneEscrow.security.ts`
- Deployment verification: `scripts/verify-coston2-deployment.ts`
- Lifecycle verification: `scripts/verify-project-lifecycle.ts`
