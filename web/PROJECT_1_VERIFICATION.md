# MilestoneX — Project #1 End-to-End Verification

**Network:** Flare Testnet Coston2  
**Chain ID:** `114`  
**Project ID:** `1`  
**Result:** Full lifecycle independently verified.

## Project state

| Field | Verified value |
|---|---|
| Client | `0x7BbB50b3e38aac305d94C53CC239cF243E2608EF` |
| Contractor | `0x54CBc5f53e16fFFAc586a2B14Bf4D9d40866DF2F` |
| USD value | `$5.00` |
| Funded | `4.663805 FXRP` |
| Released | `4.663805 FXRP` |
| Milestones | `1` |
| Completed milestones | `1` |
| Final status | `Completed` |
| Escrow balance after completion | `0 FXRP` |
| Metadata hash | `0xe3f355feb9872ae47bf3c0c45e8bfe69362605eb40954562b49614fdeaf6d981` |
| Evidence hash | `0x45f078b58a630e8fa8a48532cd65f2f4a0286a741595df51c10cc5a342b0633d` |

## Verified lifecycle transactions

| Step | Block | Transaction |
|---|---:|---|
| Project created | 33,620,552 | [`0x500275…38e30d`](https://coston2-explorer.flare.network/tx/0x500275e4323d6be5dbeaf4aab96fab15deb53dba0e71b78fe2e3e3dbf638e30d) |
| Escrow funded | 33,620,586 | [`0x276027…41415`](https://coston2-explorer.flare.network/tx/0x276027adad29a18938fec5e86488868121849eb9835965c2b9486884c6241415) |
| Evidence submitted | 33,620,609 | [`0x1d2e1c…42121`](https://coston2-explorer.flare.network/tx/0x1d2e1c5f81025f0a0e9bb577b40040d87e4c7ef25a50bfb220de5680b9942121) |
| Milestone released and project completed | 33,620,628 | [`0x35b8db…a5304`](https://coston2-explorer.flare.network/tx/0x35b8db6dc90a44484a855827aca2802260b434119c844274f6c02c79270a5304) |

The ERC-20 approval transaction is separate from the escrow event sequence and can also be included in the final demo receipt list.

## Funding proof

At funding, FTSOv2 returned:

- XRP/USD price in 18-decimal form: `1.072086`
- Project requirement: `4.663805 FXRP`

The escrow emitted `ProjectFunded` with the same amount and price.

## Release proof

The release transaction contains an FXRP `Transfer` event:

- From: MilestoneX escrow `0xDfC525b55837687A0EAA04e99491a74cBa0B78EE`
- To: Contractor `0x54CBc5f53e16fFFAc586a2B14Bf4D9d40866DF2F`
- Amount: `4.663805 FXRP`

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

`contracts/deployments/project-1-verification.json`
