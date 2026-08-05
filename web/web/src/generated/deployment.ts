// Public Coston2 deployment manifest. Safe to commit and expose in the client.
export const deployment = {
  network: "coston2",
  chainId: 114,
  deployedAt: "2026-08-04T13:49:57.624Z",
  deployer: "0x7bbb50b3e38aac305d94c53cc239cf243e2608ef",
  flareContractRegistry: "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019",
  assetManagerFXRP: "0xc1Ca88b937d0b528842F95d5731ffB586f4fbDFA",
  fxrp: "0x0b6A3645c240605887a5532109323A3E12273dc7",
  ftsoXrpUsdOracle: "0xb49fD561664199fA28C9ed65644BF6f3e1332DB0",
  milestoneFundingForwarder: "0xc8d3A6F34e6595369A5ED0a369EBD7838c726e92",
  milestoneEscrow: "0xDfC525b55837687A0EAA04e99491a74cBa0B78EE",
  transactions: {
    oracle: "0xec8f48452fb79a79831df7c972df8aa390bb9e73be5165c05606c494da7b7360",
    forwarder: "0x67750be5f56f4fb26f251711938ccb4e649c5fbf79b4ba21a183b0f441c58c2d",
    escrow: "0x9eedcd001c95c18d0ea1ee32d2d960186ec4f7a2788a2926ea2462013369307f",
  },
} as const;
