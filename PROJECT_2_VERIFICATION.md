# MilestoneX — Project #2 Repeatability Verification

**Network:** Flare Testnet Coston2  
**Chain ID:** `114`  
**Project ID:** `2`  
**Purpose:** Hands-on repeatability test after Project #1  
**Result:** Full lifecycle independently verified.

## Project state

| Field | Verified value |
|---|---|
| Client | `0x7BbB50b3e38aac305d94C53CC239cF243E2608EF` |
| Contractor | `0x54CBc5f53e16fFFAc586a2B14Bf4D9d40866DF2F` |
| USD value | `$0.50` |
| Funding XRP/USD price | `$1.064846` |
| Funded | `0.469552 FXRP` |
| Released | `0.469552 FXRP` |
| Milestones | `1` |
| Completed milestones | `1` |
| Final status | `Completed` |
| Escrow balance after completion | `0 FXRP` |
| Metadata hash | `0x13a5de78e3712104b227b0ed9be382d6aecc2d00acb933b58ae292f266655194` |
| Evidence hash | `0x45f078b58a630e8fa8a48532cd65f2f4a0286a741595df51c10cc5a342b0633d` |

## Verified lifecycle transactions

| Step | Block | Transaction |
|---|---:|---|
| Project created | 33,659,078 | [`0x330429…35159c`](https://coston2-explorer.flare.network/tx/0x330429e13aa0e6782d70bfe4c3114a19342bf5c5c49eac7654f73d63a335159c) |
| Escrow funded | 33,659,101 | [`0xdc2835…91bc6`](https://coston2-explorer.flare.network/tx/0xdc2835f38843401546a43536c8ecc33a152646f4c468904ed11c162f33f91bc6) |
| Evidence submitted | 33,659,123 | [`0x603c44…f2b52`](https://coston2-explorer.flare.network/tx/0x603c441242aa2b84a72c672aed3c60470cfe9dbfede84e9ca40f3e37ef3f2b52) |
| Milestone released and project completed | 33,659,143 | [`0x876d24…43867`](https://coston2-explorer.flare.network/tx/0x876d2486c05d7397ae97c6f72d0d3c659bfbaf6606be94711fcff6e51b443867) |

## Release proof

The release transaction contains a test FXRP `Transfer` event:

- From: MilestoneX escrow `0xDfC525b55837687A0EAA04e99491a74cBa0B78EE`
- To: Contractor `0x54CBc5f53e16fFFAc586a2B14Bf4D9d40866DF2F`
- Amount: `0.469552 FXRP`

After release:

- `fundedFxrp == releasedFxrp`
- Escrow's test FXRP balance is zero
- Milestone is marked submitted and released
- Project status is `Completed`

## Automated verification checks

- [x] Project exists
- [x] Project status is completed
- [x] Project has exactly one milestone
- [x] Milestone sequence reached the end
- [x] Evidence hash is present
- [x] Evidence is marked submitted
- [x] Milestone is marked released
- [x] Full funded amount was released
- [x] Matching FXRP transfer to contractor exists
- [x] Escrow has no trapped FXRP
- [x] All five required lifecycle events exist

Machine-readable evidence is stored at:

`contracts/deployments/project-2-verification.json`

Project #2 is a repeatability check, not an independent user-validation claim.
