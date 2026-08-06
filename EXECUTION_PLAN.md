# MilestoneX — 10-Day Execution Plan

**Official DoraHacks deadline:** August 15, 2026 at 00:59 PKT  
**Internal hard deadline:** August 14, 2026 at 18:00 PKT  
**Safety buffer:** 6 hours 59 minutes  
**Repository:** https://github.com/huzi0000/milestonex-flare

## Delivery status update — August 6

This file preserves the original ten-day plan. It is not a claim that every planned stretch task shipped.

**Delivered:** deployed Coston2 contracts, FXRP escrow, FTSOv2 pricing, direct and EIP-712-authorized funding contracts, role-controlled evidence and release, mutual cancellation logic, two machine-verified lifecycles, 18 automated contract/security tests, responsive public application, deployment/lifecycle proof pages, live activity receipts, faucet onboarding, architecture, security review, and reproducibility materials.

**Intentionally deferred or documented as roadmap:** hosted relayer service, backend event indexer, production rate limiting, cancellation/dispute UI, timeout-based unilateral recovery, professional audit, mainnet deployment, WalletConnect/multi-wallet discovery, and independent user interviews. The public application labels the dashboard project builder as a UI preview; real writes occur in the dedicated lifecycle console. No user-validation or traction claim is made.

**Still required before submission:** edited demo video, final DoraHacks copy, short roadmap, AI-assistance disclosure, final link/compliance audit, and BUIDL submission.

## Current position — August 4

- [x] DoraHacks account created
- [x] Registered as Hacker
- [x] Dedicated Coston2 wallet configured
- [x] Free faucet C2FLR and test FXRP received
- [x] Public GitHub repository created
- [x] Coston2 RPC connectivity verified
- [x] FXRP contract resolved through Flare Contract Registry
- [x] XRP/USD FTSOv2 feed read successfully
- [x] Initial escrow contract compiled
- [x] Six contract tests pass, including EIP-712 relayed funding
- [x] Initial code pushed to public repository

## Day 1 — August 5: contract foundation

- Finalize project and milestone state machine
- Add dispute-safe mutual cancellation and refund behavior
- Add event coverage and custom errors
- Implement EIP-712 gas-abstraction forwarder
- Expand contract unit tests
- Run static review and document assumptions

**Exit criterion:** All contract tests pass; no critical state transition is undefined.

## Day 2 — August 6: Coston2 deployment

- Add secure deployment and verification scripts
- Deploy FTSO XRP/USD adapter
- Deploy milestone escrow
- Resolve and validate test FXRP
- Create, fund, submit evidence, and release one test milestone
- Save explorer links and transaction hashes

**Exit criterion:** Real end-to-end contract flow completes on Coston2.

## Day 3 — August 7: relayer and application data layer

- Implement signed-payment request validation
- Add nonce, expiry, replay, and relayer authorization controls
- Build typed contract client and event indexer
- Define project metadata and evidence storage strategy
- Add server-side input validation and rate limiting

**Exit criterion:** Application backend reads and writes all required testnet states safely.

## Day 4 — August 8: client experience

- Wallet connection and Coston2 network guard
- Client dashboard
- Create-project and milestone builder flow
- Live FTSOv2 XRP/USD quote
- FXRP allowance/funding states

**Exit criterion:** Client can create and fund a project from the web UI.

## Day 5 — August 9: contractor experience

- Contractor invitation/project view
- Evidence submission with deterministic hash
- Milestone review and release flow
- Payment receipt and explorer links
- Empty, loading, pending, success, rejection, and RPC-error states

**Exit criterion:** Contractor-to-client milestone lifecycle works through the UI.

## Day 6 — August 10: end-to-end reliability

- Integrate relayer flow
- Add cancellation/refund UI
- Cache/read fallback strategy
- Test wallet rejection, stale quote, insufficient balance, allowance failure, RPC delay, duplicate action, and wrong network
- Create deterministic demo seed/project

**Exit criterion:** Full demo succeeds repeatedly without manual database edits.

## Day 7 — August 11: security and quality

- Contract access-control and reentrancy review
- Property/invariant tests for accounting
- Frontend validation and authorization review
- Secret scan and dependency review
- Accessibility and responsive-layout audit
- Performance pass

**Exit criterion:** No known critical/high-severity issue; mobile and desktop flows pass.

## Day 8 — August 12: user evidence and polish

- Obtain honest feedback from freelancers/clients
- Record feedback and resulting product changes
- Polish visual design, copy, onboarding, and receipts
- Finalize architecture diagram
- Finalize Flare integration explanation

**Exit criterion:** Product value is understandable in 15 seconds and supported by genuine feedback.

## Day 9 — August 13: submission assets

- Final public README
- Setup/testing instructions
- Contract addresses and transaction links
- Demo script and backup recording
- Product screenshots
- Short roadmap
- Evidence of new work
- AI-assistance and third-party licence disclosure

**Exit criterion:** A judge can evaluate the product from repository and demo without contacting us.

## Day 10 — August 14: submit early

- Run final tests from a clean checkout
- Verify live application anonymously
- Verify every explorer/repository/video link
- Complete DoraHacks BUIDL fields
- Submit by **18:00 PKT**
- Re-open the submitted page and audit all fields

**Exit criterion:** Submission is accepted and independently rechecked before the platform deadline.

## Scope lock

### Required

- FXRP milestone escrow
- FTSOv2 XRP/USD quote
- Client and contractor roles
- Evidence hashes
- Sequential partial releases
- Mutual cancellation/refund
- Real Coston2 transactions
- Responsive judge-testable application

### Stretch only after required scope works

- Gas abstraction beyond the initial documented flow
- Project templates
- Notifications
- Multi-currency display
- Advanced analytics

### Explicitly excluded

- Mainnet funds
- Fiat banking
- KYC
- DAO arbitration
- Native mobile app
- Multiple blockchains
- Custodial wallets
- Unsupported financial guarantees
