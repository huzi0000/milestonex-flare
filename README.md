# MilestoneX

**Programmable FXRP milestone payments for global work.**

MilestoneX is a non-custodial Coston2 prototype that helps clients and freelancers structure projects into USD-denominated milestones, fund them with test FXRP, submit verifiable evidence, and release payments transparently as work is approved.

> Built for the Flare Summer Signal Hackathon — Interoperable Asset Products track.

**Live application:** https://milestonex-flare.vercel.app/  
**Coston2 deployment console:** https://milestonex-flare.vercel.app/deploy.html  
**Live lifecycle console:** https://milestonex-flare.vercel.app/lifecycle.html

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
- **Gas-abstraction pattern:** An EIP-712 funding forwarder lets a relayer submit a client-signed funding authorization after the client's one-time FXRP approval.

## Current technical status

- Coston2 RPC connection verified
- FXRP Asset Manager and test FXRP resolved through Flare Contract Registry
- XRP/USD FTSOv2 feed read successfully
- Initial escrow contract implemented
- EIP-712 funding forwarder implemented with nonce, deadline, signer, and replay protection
- Six automated contract tests passing
- Safe Coston2 deployment script prepared
- Responsive React/Vite application shell implemented
- Live read-only Coston2 block, FXRP, wallet-balance, and FTSOv2 price integration implemented
- Interactive project dashboard, project audit view, milestone workflow, activity view, and project-creation flow implemented
- Oracle adapter, EIP-712 forwarder, and milestone escrow deployed and independently verified on Coston2
- Guided two-account lifecycle console implemented for real create, approve, fund, evidence, and release transactions
- Project #1 completed end-to-end on Coston2 with `4.663805 FXRP` funded and released
- Full lifecycle events, FXRP transfer, accounting, evidence hash, and zero remaining escrow balance independently verified
- Unified milestone-route brand identity shared across dashboard, deployment, lifecycle, project, activity, and network views
- Persistent dark/light themes, system-preference detection, reduced-motion support, and purposeful interface animation
- Built-in 60-second Judge Mode covering problem, workflow, Flare integration, and live proof
- Responsive QA passed in both themes at 320, 360, 390, 430, 768, 900, 1024, 1280, and 1440 px
- Open Graph/Twitter social preview and final favicon assets included
- Final security expansion, user validation, and submission assets in progress

See [`TECHNICAL_SPIKE.md`](./TECHNICAL_SPIKE.md) for the verified addresses and initial feasibility results.

## Repository structure

```text
milestonex-flare/
├── contracts/                 # Solidity contracts, Hardhat scripts and tests
├── web/                       # Responsive React/Vite application and local visuals
├── ATTRIBUTIONS.md            # Visual, Flare mark, and third-party attribution
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

## Coston2 contracts

| Component | Address |
|---|---|
| FTSOv2 XRP/USD adapter | [`0xb49fD561664199fA28C9ed65644BF6f3e1332DB0`](https://coston2-explorer.flare.network/address/0xb49fD561664199fA28C9ed65644BF6f3e1332DB0) |
| EIP-712 funding forwarder | [`0xc8d3A6F34e6595369A5ED0a369EBD7838c726e92`](https://coston2-explorer.flare.network/address/0xc8d3A6F34e6595369A5ED0a369EBD7838c726e92) |
| Milestone escrow | [`0xDfC525b55837687A0EAA04e99491a74cBa0B78EE`](https://coston2-explorer.flare.network/address/0xDfC525b55837687A0EAA04e99491a74cBa0B78EE) |

See [`DEPLOYMENT_VERIFICATION.md`](./DEPLOYMENT_VERIFICATION.md) and [`contracts/deployments/coston2-verification.json`](./contracts/deployments/coston2-verification.json) for independent receipt, bytecode, linkage, and oracle checks.

The first real workflow is documented in [`PROJECT_1_VERIFICATION.md`](./PROJECT_1_VERIFICATION.md) with machine-readable evidence at [`contracts/deployments/project-1-verification.json`](./contracts/deployments/project-1-verification.json).

## Web application

```bash
cd web
npm install
npm run dev
```

Production validation:

```bash
npm run build
```

The current UI reads public Coston2 and FTSOv2 data directly. Contract-write actions remain clearly marked as prototype/demo behavior until the deployment manifest is available.

### Browser deployment console

After deploying the `web/` directory, open:

```text
/deploy.html
```

The console deploys the FTSOv2 adapter, EIP-712 forwarder, and escrow sequentially through MetaMask on Coston2. It refuses other chain IDs, verifies deployed bytecode, and exports a public `coston2.json` manifest. The deployment page never requests or receives a private key.

Contract artifacts for the console are generated from Hardhat outputs:

```bash
cd contracts
npm run export:web
```

### Live lifecycle console

Open `/lifecycle.html` to complete a real two-account testnet flow:

1. Connect the client wallet.
2. Create a one-milestone project.
3. Approve the quoted test FXRP.
4. Fund the deployed escrow.
5. Switch to the contractor account and submit an evidence hash.
6. Switch back to the client and release payment.

The console reads contract state after every transaction and links each receipt to the Coston2 explorer.

Responsive and visual QA evidence is documented in [`web/RESPONSIVE_AUDIT.md`](./web/RESPONSIVE_AUDIT.md). Final theme-toggle, explicit dark-surface, overflow, and fallback verification is documented in [`web/THEME_RESPONSIVE_QA.md`](./web/THEME_RESPONSIVE_QA.md).

## Visual system

The interface includes persistent dark/light themes, the shared **Milestone Rise** identity, reduced-motion support, an original green-only 3D escrow visual, and a responsive animated explanation of the complete Agree → Lock → Prove → Release flow. Flare ecosystem marks are used only for technology identification and are documented in [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md).

## Security

- Never commit `.env` files, private keys, seed phrases, or API credentials.
- Use a dedicated Coston2-only development wallet containing no real assets.
- The current software is an unaudited hackathon prototype and must not hold real funds.
- No mainnet deployment is supported at this stage.

## Disclaimer

MilestoneX is experimental software created for testnet demonstration and technical evaluation. It is not a bank, escrow agent, payment processor, legal arbitration service, investment product, or financial guarantee.

## Licence

[MIT](./LICENSE)
