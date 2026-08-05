# MilestoneX — Coston2 Technical Feasibility Spike

**Date:** 2026-08-04  
**Result:** Core concept passes the initial feasibility gate.

## Verified live against Coston2

A read-only Hardhat/Ethers script connected to the public Coston2 RPC without a private key and confirmed:

- Chain ID: `114`
- Flare Contract Registry: `0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019`
- FTSOv2 contract resolved through the registry: `0xC4e9c78EA53db782E28f28Fdf80BaF59336B304d`
- FXRP Asset Manager resolved through the registry: `0xc1Ca88b937d0b528842F95d5731ffB586f4fbDFA`
- Test FXRP token resolved from the Asset Manager: `0x0b6A3645c240605887a5532109323A3E12273dc7`
- Token metadata returned:
  - Name: `FXRP`
  - Symbol: `FTestXRP`
  - Decimals: `6`
- XRP/USD FTSOv2 feed returned a current value successfully.
- Feed ID: `0x015852502f55534400000000000000000000000000`

The verification command is:

```bash
cd contracts
npm install
npm run compile
npx hardhat run scripts/check-coston2.ts --network coston2
```

It is read-only and does not need a wallet key.

## Local contract prototype completed

The initial `MilestoneEscrow` prototype now supports:

- Creating a client/contractor project with 1–12 USD-denominated milestones
- Reading an injectable XRP/USD oracle
- Converting USD cents to six-decimal FXRP base units
- Rounding funding requirements upward to prevent underfunding
- Client-defined maximum amount for quote/slippage protection
- Depositing FXRP through `transferFrom`
- Sequential contractor evidence hashes
- Client-controlled milestone release
- Proportional partial payments
- Final remainder handling so rounding dust cannot become trapped
- Mutual cancellation approval
- Refund of unreleased funds
- EIP-712 relayed funding after one-time FXRP approval
- Per-client nonces, authorization deadlines, signer verification, and replay protection
- Access control, status checks, reentrancy protection, and SafeERC20 transfers

## Automated test result

```text
MilestoneEscrow
  ✔ quotes USD cents into six-decimal FXRP using the oracle
  ✔ funds and releases a complete project milestone by milestone
  ✔ protects the client from quote slippage
  ✔ funds through an EIP-712 authorization without the client sending the funding transaction
  ✔ requires sequential evidence and client-authorized release
  ✔ refunds unreleased funds only after both parties approve cancellation

6 passing
```

The project compiled 112 Solidity files successfully with Solidity 0.8.25 and the Cancun EVM target.

## Files created

- `contracts/contracts/MilestoneEscrow.sol`
- `contracts/contracts/MilestoneFundingForwarder.sol`
- `contracts/contracts/FtsoXrpUsdOracle.sol`
- `contracts/contracts/interfaces/IMilestoneFunding.sol`
- `contracts/contracts/interfaces/IXrpUsdOracle.sol`
- `contracts/contracts/test/MockFxrp.sol`
- `contracts/contracts/test/MockXrpUsdOracle.sol`
- `contracts/test/MilestoneEscrow.ts`
- `contracts/scripts/check-coston2.ts`
- `contracts/.env.example`

## Remaining feasibility gates

- [x] Compile and test the EIP-712 gas-abstraction forwarder
- [x] Add the Coston2 deployment script without committing any private key
- [ ] Deploy the FTSO adapter, forwarder, and escrow from the entrant's dedicated test wallet
- [ ] Approve test FXRP and fund one test project
- [ ] Release one milestone on Coston2
- [ ] Record contract addresses and transaction hashes

## Security note

No entrant wallet address, private key, seed phrase, or API secret was requested or used during this spike. Deployment must be performed with the entrant's dedicated Coston2 wallet through a secure local environment or wallet-based deployment flow.
