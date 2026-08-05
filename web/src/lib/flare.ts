import {
  createPublicClient,
  defineChain,
  encodeAbiParameters,
  formatUnits,
  http,
  keccak256,
  parseAbi,
  type Address,
} from "viem";

export const COSTON2_CHAIN_ID = 114;
export const COSTON2_EXPLORER = "https://coston2-explorer.flare.network";
export const COSTON2_FAUCET = "https://faucet.flare.network/coston2";
export const COSTON2_RPC = "https://coston2-api.flare.network/ext/C/rpc";
export const FLARE_REGISTRY = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019" as Address;
export const XRP_USD_FEED_ID =
  "0x015852502f55534400000000000000000000000000" as `0x${string}`;

export const coston2 = defineChain({
  id: COSTON2_CHAIN_ID,
  name: "Flare Testnet Coston2",
  nativeCurrency: { name: "Coston2 Flare", symbol: "C2FLR", decimals: 18 },
  rpcUrls: {
    default: { http: [COSTON2_RPC] },
  },
  blockExplorers: {
    default: { name: "Coston2 Explorer", url: COSTON2_EXPLORER },
  },
  testnet: true,
});

export const publicClient = createPublicClient({
  chain: coston2,
  transport: http(COSTON2_RPC),
});

const registryAbi = parseAbi([
  "function getContractAddressByHash(bytes32) view returns (address)",
]);
const assetManagerAbi = parseAbi(["function fAsset() view returns (address)"]);
const tokenAbi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
]);
const ftsoAbi = parseAbi([
  "function getFeedById(bytes21) view returns (uint256 value, int8 decimals, uint64 timestamp)",
]);

const registryHash = (name: string) =>
  keccak256(encodeAbiParameters([{ type: "string" }], [name]));

export type NetworkSnapshot = {
  blockNumber: bigint;
  ftsoAddress: Address;
  assetManagerAddress: Address;
  fxrpAddress: Address;
  fxrpName: string;
  fxrpSymbol: string;
  fxrpDecimals: number;
  xrpUsdPrice: number;
  priceTimestamp: number;
  source?: "live" | "verified-fallback";
};

export const verifiedNetworkFallback: NetworkSnapshot = {
  blockNumber: 33_620_628n,
  ftsoAddress: "0xC4e9c78EA53db782E28f28Fdf80BaF59336B304d",
  assetManagerAddress: "0xc1Ca88b937d0b528842F95d5731ffB586f4fbDFA",
  fxrpAddress: "0x0b6A3645c240605887a5532109323A3E12273dc7",
  fxrpName: "FXRP",
  fxrpSymbol: "FTestXRP",
  fxrpDecimals: 6,
  xrpUsdPrice: 1.072086,
  priceTimestamp: 1_785_851_493,
  source: "verified-fallback",
};

export async function getNetworkSnapshot(): Promise<NetworkSnapshot> {
  const [blockNumber, ftsoAddress, assetManagerAddress] = await Promise.all([
    publicClient.getBlockNumber(),
    publicClient.readContract({
      address: FLARE_REGISTRY,
      abi: registryAbi,
      functionName: "getContractAddressByHash",
      args: [registryHash("FtsoV2")],
    }),
    publicClient.readContract({
      address: FLARE_REGISTRY,
      abi: registryAbi,
      functionName: "getContractAddressByHash",
      args: [registryHash("AssetManagerFXRP")],
    }),
  ]);

  const fxrpAddress = await publicClient.readContract({
    address: assetManagerAddress,
    abi: assetManagerAbi,
    functionName: "fAsset",
  });

  const [fxrpName, fxrpSymbol, fxrpDecimals, feed] = await Promise.all([
    publicClient.readContract({ address: fxrpAddress, abi: tokenAbi, functionName: "name" }),
    publicClient.readContract({ address: fxrpAddress, abi: tokenAbi, functionName: "symbol" }),
    publicClient.readContract({ address: fxrpAddress, abi: tokenAbi, functionName: "decimals" }),
    publicClient.readContract({
      address: ftsoAddress,
      abi: ftsoAbi,
      functionName: "getFeedById",
      args: [XRP_USD_FEED_ID],
    }),
  ]);

  const [value, decimals, timestamp] = feed;
  const xrpUsdPrice = Number(formatUnits(value, Number(decimals)));

  return {
    blockNumber,
    ftsoAddress,
    assetManagerAddress,
    fxrpAddress,
    fxrpName,
    fxrpSymbol,
    fxrpDecimals,
    xrpUsdPrice,
    priceTimestamp: Number(timestamp),
    source: "live",
  };
}

export async function getFxrpBalance(
  account: Address,
  snapshot: NetworkSnapshot,
): Promise<number> {
  const raw = await publicClient.readContract({
    address: snapshot.fxrpAddress,
    abi: tokenAbi,
    functionName: "balanceOf",
    args: [account],
  });
  return Number(formatUnits(raw, snapshot.fxrpDecimals));
}

export async function connectWallet(): Promise<Address> {
  if (!window.ethereum) throw new Error("MetaMask or another injected wallet is required.");
  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as Address[];
  if (!accounts[0]) throw new Error("No wallet account was returned.");
  return accounts[0];
}

export async function ensureCoston2(): Promise<void> {
  if (!window.ethereum) throw new Error("MetaMask or another injected wallet is required.");
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x72" }],
    });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code !== 4902) throw error;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0x72",
          chainName: "Flare Testnet Coston2",
          nativeCurrency: { name: "Coston2 Flare", symbol: "C2FLR", decimals: 18 },
          rpcUrls: [COSTON2_RPC],
          blockExplorerUrls: [COSTON2_EXPLORER],
        },
      ],
    });
  }
}

export const shortAddress = (value?: string) =>
  value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "Not connected";
