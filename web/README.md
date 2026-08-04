# MilestoneX Web

Responsive React/Vite interface for the MilestoneX Coston2 prototype.

## Current capabilities

- Live Coston2 RPC status and block number
- Live XRP/USD FTSOv2 price
- FXRP and Asset Manager resolution through Flare Contract Registry
- Optional MetaMask connection and Coston2 network switching
- Connected-wallet test FXRP balance
- Responsive client dashboard
- Project detail and milestone audit trail
- Three-step project builder with live FXRP estimates
- Activity and network views
- Explicit prototype labeling for actions that are not yet wired to deployed contracts
- Dedicated `/deploy.html` Coston2 deployment console using injected MetaMask signing
- Sequential bytecode-verified deployment and downloadable public manifest
- Guided `/lifecycle.html` two-wallet workflow for real contract writes
- Live project, allowance, escrow, evidence, release, role, and receipt state

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Safety

The app must never receive a private key or seed phrase. Wallet interactions use the injected provider supplied by the user's wallet extension. This is a Coston2-only prototype and must not be used with real funds.
