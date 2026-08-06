# MilestoneX Release-Candidate QA

**Audit date:** 2026-08-06  
**Target:** Flare Summer Signal — Bounty 1  
**Network:** Flare Testnet Coston2, chain ID 114  
**Result:** PASS after the fixes documented below

## Automated application QA

A headless Chromium release audit exercised the public application structure at:

- 320 × 800
- 390 × 844
- 768 × 1024
- 1024 × 768
- 1440 × 900

Surfaces checked:

- Dashboard
- Live project list and proof links
- Onchain Activity
- Network infrastructure
- Lifecycle console
- Deployment console
- Judge Mode
- Light/dark persistence
- Shared branding
- Responsive overflow
- Image loading
- Named interactive controls
- Public faucet/documentation/explorer destinations

**Result:** `212 checks · 0 failures`

## Accessibility

Axe WCAG 2 A/AA and WCAG 2.1 A/AA checks were run against:

- Dashboard — light and dark
- Activity — light and dark
- Network — light and dark
- Lifecycle — light and dark
- Deployment — light and dark

The release candidate includes fixes for icon-only accessible names, small-text contrast, light-theme brand green, dark Copy JSON contrast, responsive status labels, and lifecycle progress semantics.

**Result:** `0 automated WCAG violations across 10 page/theme combinations`

Automated testing does not replace manual assistive-technology testing, but no known automated A/AA failure remains.

## Build and dependencies

- TypeScript production build: PASS
- Vite production build: PASS (`2,010` modules transformed)
- Web production dependency audit (`npm audit`): `0` vulnerabilities
- Contract production dependency audit (`npm audit --omit=dev`): `0` vulnerabilities
- Hardhat development-tool dependency tree: `20` transitive advisories (`11 low`, `2 moderate`, `7 high`, `0 critical`); these development-only packages are not shipped to the browser or deployed contracts, and eliminating them requires a breaking Hardhat 3 migration that is outside the release-candidate scope.

## Smart-contract tests

- Core behavior: 6 passing
- Security and invariants: 12 passing
- Total: **18 passing**

Coverage includes authorization, role enforcement, oracle freshness, upward quote rounding, slippage, evidence order, partial/final release accounting, mutual cancellation, global escrow balance, EIP-712 signer/deadline/nonce/chain binding, and replay rejection.

## Current Coston2 deployment verification

Latest block observed during audit: `33,688,693`

| Component | Receipt | Bytecode size |
|---|---:|---:|
| FTSOv2 XRP/USD adapter | Success | 634 bytes |
| EIP-712 funding forwarder | Success | 2,898 bytes |
| Milestone escrow | Success | 6,643 bytes |

Verified linkage:

- Escrow → test FXRP: match
- Escrow → oracle adapter: match
- Escrow → funding forwarder: match
- FXRP decimals: 6
- EIP-712 domain: `MilestoneXFundingForwarder`, version `1`, chain `114`
- Next project ID: `4`

## Lifecycle verification

| Project | USD value | Funded | Released | Status | Contractor transfer | Escrow remainder |
|---|---:|---:|---:|---|---|---:|
| #1 | $5.00 | 4.663805 FXRP | 4.663805 FXRP | Completed | Exact transfer found | 0 FXRP |
| #2 | $0.50 | 0.469552 FXRP | 0.469552 FXRP | Completed | Exact transfer found | 0 FXRP |
| #3 | $3.00 | 2.859442 FXRP | 2.859442 FXRP | Completed | Exact transfer found | 0 FXRP |

All three projects have submitted evidence, released milestones, successful release receipts, exact contractor transfers, and complete accounting.

## Public-link and interaction audit

- All twelve verified Activity transaction links for Projects #1–3 returned successfully; future lifecycle receipts are persisted locally for the same browser.
- All three deployed contract explorer links returned successfully.
- Main, lifecycle, deployment, favicon, Open Graph image, and hero visual returned successfully.
- Official Coston2 faucet returned successfully.
- GitHub repository and README were independently retrieved.
- Source scan found no direct dead buttons or anchors.
- Source scan found no committed secret value, analytics SDK, telemetry beacon, cookie API, IndexedDB use, or session storage.

Expected local browser storage is limited to theme, selected lifecycle project ID, public lifecycle receipt hashes, and an optional public deployment manifest.

## Issues found and corrected during release QA

1. `$0.50` displayed as `$1` because currency formatting removed cents.
2. Completed lifecycle showed Connect as incomplete when no wallet was currently attached.
3. Icon-only explorer, copy, and refresh controls lacked accessible names.
4. Several small light-theme labels missed 4.5:1 contrast.
5. Dark-mode Copy JSON text was effectively invisible on a white button.
6. Some legacy muted labels missed contrast in both themes.
7. Activity originally contained illustrative rows; it now uses eight real Coston2 receipts.
8. Network status previously reused a project-only “Funds protected” pill; all network dependencies now use consistent verification marks.
9. The completed lifecycle proof card was hardcoded to Project #1; it now renders the selected project's real USD value, FXRP accounting, verification state, and current-session or known receipt hashes.

## Known product limitations

- Testnet-only prototype; no real funds or mainnet support
- No professional audit
- No dispute arbitrator
- Mutual-cancellation liveness risk
- No timeout/unilateral recovery path
- Hosted relayer not included
- The main Create on Coston2 CTA performs real writes through the lifecycle console; that browser workflow currently exposes one milestone per project while the contract supports and tests 1–12
- Evidence content remains offchain; only hashes are committed

See `contracts/SECURITY_REVIEW.md` for the complete threat model and limitations.
