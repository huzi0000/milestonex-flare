# MilestoneX — Coston2 Deployment Verification

**Verified:** 2026-08-04  
**Network:** Flare Testnet Coston2  
**Chain ID:** `114`  
**Result:** All deployment and linkage checks passed.

## Contracts

| Component | Address | Bytecode size | Deployment block | Transaction |
|---|---|---:|---:|---|
| FTSOv2 XRP/USD adapter | `0xb49fD561664199fA28C9ed65644BF6f3e1332DB0` | 634 bytes | 33,619,880 | `0xec8f48452fb79a79831df7c972df8aa390bb9e73be5165c05606c494da7b7360` |
| EIP-712 funding forwarder | `0xc8d3A6F34e6595369A5ED0a369EBD7838c726e92` | 2,898 bytes | 33,619,890 | `0x67750be5f56f4fb26f251711938ccb4e649c5fbf79b4ba21a183b0f441c58c2d` |
| Milestone escrow | `0xDfC525b55837687A0EAA04e99491a74cBa0B78EE` | 6,643 bytes | 33,619,901 | `0x9eedcd001c95c18d0ea1ee32d2d960186ec4f7a2788a2926ea2462013369307f` |

## Independent checks performed

- [x] Public RPC reports chain ID 114.
- [x] All three deployment receipts have status `1`.
- [x] All three addresses contain deployed bytecode.
- [x] FTSOv2 adapter returns a current XRP/USD value.
- [x] Forwarder EIP-712 domain name is `MilestoneXFundingForwarder`.
- [x] Forwarder EIP-712 domain version is `1`.
- [x] Forwarder EIP-712 domain chain ID is `114`.
- [x] Escrow points to test FXRP `0x0b6A3645c240605887a5532109323A3E12273dc7`.
- [x] Escrow points to the deployed FTSOv2 adapter.
- [x] Escrow points to the deployed funding forwarder.
- [x] Escrow reads six FXRP decimals.
- [x] Initial `nextProjectId` is `1`, confirming no project has yet been created.

## Explorer links

- Oracle: https://coston2-explorer.flare.network/address/0xb49fD561664199fA28C9ed65644BF6f3e1332DB0
- Forwarder: https://coston2-explorer.flare.network/address/0xc8d3A6F34e6595369A5ED0a369EBD7838c726e92
- Escrow: https://coston2-explorer.flare.network/address/0xDfC525b55837687A0EAA04e99491a74cBa0B78EE

## Next verification gate

Complete one real testnet lifecycle:

1. Client creates a project.
2. Client approves and funds it with test FXRP.
3. Contractor submits an evidence hash.
4. Client releases the milestone.
5. Contract accounting and transaction links are re-verified independently.
