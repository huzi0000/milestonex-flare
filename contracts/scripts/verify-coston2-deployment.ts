import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import fs from "node:fs";
import path from "node:path";

type Manifest = {
  network: string;
  chainId: number;
  deployer: string;
  fxrp: string;
  ftsoXrpUsdOracle: string;
  milestoneFundingForwarder: string;
  milestoneEscrow: string;
  transactions: Record<"oracle" | "forwarder" | "escrow", string>;
};

const RPC = process.env.COSTON2_RPC_URL ?? "https://coston2-api.flare.network/ext/C/rpc";

async function main() {
  const manifestPath = path.resolve(process.cwd(), "deployments/coston2.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Manifest;
  const provider = new JsonRpcProvider(RPC, 114);
  const network = await provider.getNetwork();
  if (network.chainId !== 114n || manifest.chainId !== 114) {
    throw new Error(`Wrong network: RPC ${network.chainId}, manifest ${manifest.chainId}`);
  }

  const addresses = {
    oracle: manifest.ftsoXrpUsdOracle,
    forwarder: manifest.milestoneFundingForwarder,
    escrow: manifest.milestoneEscrow,
  };

  const codeSizes: Record<string, number> = {};
  for (const [name, address] of Object.entries(addresses)) {
    const code = await provider.getCode(address);
    if (code === "0x") throw new Error(`${name} has no bytecode at ${address}`);
    codeSizes[name] = (code.length - 2) / 2;
  }

  const receipts: Record<string, { status: number | null; blockNumber: number; contractAddress: string | null }> = {};
  for (const [name, hash] of Object.entries(manifest.transactions)) {
    const receipt = await provider.getTransactionReceipt(hash);
    if (!receipt || receipt.status !== 1) throw new Error(`${name} transaction is not successful: ${hash}`);
    receipts[name] = {
      status: receipt.status,
      blockNumber: receipt.blockNumber,
      contractAddress: receipt.contractAddress,
    };
  }

  const oracle = new Contract(
    manifest.ftsoXrpUsdOracle,
    ["function latestPriceWei() view returns (uint256,uint64)"],
    provider,
  );
  const forwarder = new Contract(
    manifest.milestoneFundingForwarder,
    [
      "function nonces(address) view returns (uint256)",
      "function eip712Domain() view returns (bytes1,string,string,uint256,address,bytes32,uint256[])",
    ],
    provider,
  );
  const escrow = new Contract(
    manifest.milestoneEscrow,
    [
      "function fxrp() view returns (address)",
      "function xrpUsdOracle() view returns (address)",
      "function trustedForwarder() view returns (address)",
      "function fxrpDecimals() view returns (uint8)",
      "function nextProjectId() view returns (uint256)",
    ],
    provider,
  );

  const [[priceWei, updatedAt], domain, nonce, fxrp, oracleLink, forwarderLink, decimals, nextProjectId] = await Promise.all([
    oracle.latestPriceWei(),
    forwarder.eip712Domain(),
    forwarder.nonces(manifest.deployer),
    escrow.fxrp(),
    escrow.xrpUsdOracle(),
    escrow.trustedForwarder(),
    escrow.fxrpDecimals(),
    escrow.nextProjectId(),
  ]);

  const equal = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  if (!equal(fxrp, manifest.fxrp)) throw new Error(`Escrow FXRP mismatch: ${fxrp}`);
  if (!equal(oracleLink, manifest.ftsoXrpUsdOracle)) throw new Error(`Escrow oracle mismatch: ${oracleLink}`);
  if (!equal(forwarderLink, manifest.milestoneFundingForwarder)) throw new Error(`Escrow forwarder mismatch: ${forwarderLink}`);
  if (Number(decimals) !== 6) throw new Error(`Unexpected FXRP decimals: ${decimals}`);
  if (domain[1] !== "MilestoneXFundingForwarder" || domain[2] !== "1" || Number(domain[3]) !== 114) {
    throw new Error(`Unexpected EIP-712 domain: ${domain}`);
  }

  const output = {
    verified: true,
    chainId: network.chainId.toString(),
    latestBlock: await provider.getBlockNumber(),
    codeSizes,
    receipts,
    oracle: {
      priceWei: priceWei.toString(),
      xrpUsd: Number(formatUnits(priceWei, 18)),
      updatedAt: Number(updatedAt),
    },
    forwarder: {
      domainName: domain[1],
      domainVersion: domain[2],
      chainId: domain[3].toString(),
      deployerNonce: nonce.toString(),
    },
    escrow: {
      fxrp,
      oracle: oracleLink,
      forwarder: forwarderLink,
      decimals: decimals.toString(),
      nextProjectId: nextProjectId.toString(),
    },
  };

  const outputPath = path.resolve(process.cwd(), "deployments/coston2-verification.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
