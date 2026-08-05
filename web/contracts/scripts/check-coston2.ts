import { AbiCoder, Contract, JsonRpcProvider, keccak256 } from "ethers";

const RPC =
  process.env.COSTON2_RPC_URL ??
  "https://coston2-api.flare.network/ext/C/rpc";
const REGISTRY = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";
const XRP_USD_FEED_ID =
  "0x015852502f55534400000000000000000000000000";

async function main() {
  const provider = new JsonRpcProvider(RPC, 114);
  const network = await provider.getNetwork();
  const block = await provider.getBlockNumber();

  const registry = new Contract(
    REGISTRY,
    ["function getContractAddressByHash(bytes32) view returns (address)"],
    provider,
  );

  const hashName = (name: string) =>
    keccak256(AbiCoder.defaultAbiCoder().encode(["string"], [name]));

  const ftsoAddress: string = await registry.getContractAddressByHash(
    hashName("FtsoV2"),
  );
  const assetManagerAddress: string =
    await registry.getContractAddressByHash(hashName("AssetManagerFXRP"));

  const assetManager = new Contract(
    assetManagerAddress,
    ["function fAsset() view returns (address)"],
    provider,
  );
  const fxrpAddress: string = await assetManager.fAsset();

  const fxrp = new Contract(
    fxrpAddress,
    [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
    ],
    provider,
  );

  const ftso = new Contract(
    ftsoAddress,
    ["function getFeedById(bytes21) view returns (uint256,int8,uint64)"],
    provider,
  );

  const [name, symbol, decimals, price] = await Promise.all([
    fxrp.name(),
    fxrp.symbol(),
    fxrp.decimals(),
    ftso.getFeedById(XRP_USD_FEED_ID),
  ]);

  const [value, priceDecimals, timestamp] = price;
  // FTSOv2 returns an integer value plus the number of decimal places.
  const humanPrice = Number(value) / 10 ** Number(priceDecimals);

  console.log(
    JSON.stringify(
      {
        chainId: network.chainId.toString(),
        latestBlock: block,
        registry: REGISTRY,
        ftsoAddress,
        assetManagerAddress,
        fxrp: {
          address: fxrpAddress,
          name,
          symbol,
          decimals: decimals.toString(),
        },
        xrpUsd: {
          feedId: XRP_USD_FEED_ID,
          rawValue: value.toString(),
          decimals: priceDecimals.toString(),
          timestamp: Number(timestamp),
          humanPrice,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
