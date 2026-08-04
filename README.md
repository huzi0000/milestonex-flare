# MilestoneX

**Programmable FXRP milestone payments for global work.**

MilestoneX is a non-custodial Coston2 prototype that helps clients and freelancers structure projects into USD-denominated milestones, fund them with test FXRP, submit verifiable evidence, and release payments transparently as work is approved.

> Built for the Flare Summer Signal Hackathon — Interoperable Asset Products track.

## Why it exists

Cross-border service work often begins with a trust problem:

- Clients do not want to pay everything before delivery.
- Freelancers do not want to complete everything before payment.
- International transfers can be slow, expensive, and difficult to verify.
- Crypto payments are fast, but a plain transfer does not model project delivery.

MilestoneX turns FXRP into programmable project escrow while using Flare's decentralized XRP/USD price feed to keep milestone values understandable.

## Planned core flow

1. A client creates a project with one to twelve milestones priced in USD cents.
2. FTSOv2 returns the current XRP/USD price.
3. MilestoneX calculates and locks the required amount of test FXRP.
4. The contractor submits a cryptographic evidence hash for the active milestone.
5. The client releases that milestone's proportional FXRP payment.
6. Both parties receive an auditable Coston2 transaction trail.
7. A funded project can be cancelled only after both parties approve, returning unreleased funds.

## Meaningful Flare integration

- **FXRP:** XRP becomes programmable inside milestone escrow rather than serving as a simple wallet balance.
- **FTSOv2:** The XRP/USD feed prices USD-denominated milestones without a centralized price API.
- **Coston2:** Contracts and the complete lifecycle run against Flare's public testnet.
- **Gas-abstraction pattern:** EIP-712 authorization and relayer support are being evaluated for a lower-friction payment experience.

## Current technical status

- Coston2 RPC connection verified
- FXRP Asset Manager and test FXRP resolved through Flare Contract Registry
- XRP/USD FTSOv2 feed read successfully
- Initial escrow contract implemented
- Five initial contract tests passing
- Testnet deployment and web application in progress

See [`TECHNICAL_SPIKE.md`](./TECHNICAL_SPIKE.md) for the verified addresses and initial feasibility results.

## Repository structure

```text
milestonex-flare/
├── contracts/                 # Solidity contracts, Hardhat scripts and tests
├── EXECUTION_PLAN.md          # Internal delivery timeline
├── TECHNICAL_SPIKE.md         # Coston2 feasibility evidence
├── LICENSE
└── README.md
```

## Contract development

```bash
cd contracts
npm install
npm run compile
npm test
```

Read-only Coston2 capability check:

```bash
npx hardhat run scripts/check-coston2.ts --network coston2
```

This check does not need a private key.

## Security

- Never commit `.env` files, private keys, seed phrases, or API credentials.
- Use a dedicated Coston2-only development wallet containing no real assets.
- The current software is an unaudited hackathon prototype and must not hold real funds.
- No mainnet deployment is supported at this stage.

## Disclaimer

MilestoneX is experimental software created for testnet demonstration and technical evaluation. It is not a bank, escrow agent, payment processor, legal arbitration service, investment product, or financial guarantee.

## Licence

[MIT](./LICENSE)
