import { AbiCoder, Contract, formatEther, keccak256 } from "ethers";
import { ethers } from "hardhat";
import fs from "node:fs";
import path from "node:path";

const COSTON2_CHAIN_ID = 114n;
const FLARE_CONTRACT_REGISTRY =
  "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";

async function main() {
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== COSTON2_CHAIN_ID) {
    throw new Error(
      `Refusing to deploy on chain ${network.chainId}; expected Coston2 (${COSTON2_CHAIN_ID}).`,
    );
  }

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer signer configured. Set PRIVATE_KEY in a local .env file.");
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`C2FLR balance: ${formatEther(balance)}`);

  const registry = new Contract(
    FLARE_CONTRACT_REGISTRY,
    ["function getContractAddressByHash(bytes32) view returns (address)"],
    deployer,
  );
  const hashName = (name: string) =>
    keccak256(AbiCoder.defaultAbiCoder().encode(["string"], [name]));

  const assetManagerAddress: string =
    await registry.getContractAddressByHash(hashName("AssetManagerFXRP"));
  const assetManager = new Contract(
    assetManagerAddress,
    ["function fAsset() view returns (address)"],
    deployer,
  );
  const fxrpAddress: string = await assetManager.fAsset();

  console.log(`FXRP Asset Manager: ${assetManagerAddress}`);
  console.log(`FXRP token: ${fxrpAddress}`);

  const oracle = await ethers.deployContract("FtsoXrpUsdOracle");
  await oracle.waitForDeployment();
  console.log(`FtsoXrpUsdOracle: ${await oracle.getAddress()}`);

  const forwarder = await ethers.deployContract("MilestoneFundingForwarder");
  await forwarder.waitForDeployment();
  console.log(`MilestoneFundingForwarder: ${await forwarder.getAddress()}`);

  const escrow = await ethers.deployContract("MilestoneEscrow", [
    fxrpAddress,
    await oracle.getAddress(),
    await forwarder.getAddress(),
  ]);
  await escrow.waitForDeployment();
  console.log(`MilestoneEscrow: ${await escrow.getAddress()}`);

  const [priceWei, updatedAt] = await oracle.latestPriceWei();
  console.log(`XRP/USD price (1e18): ${priceWei}`);
  console.log(`FTSO updated at: ${updatedAt}`);

  const deployment = {
    network: "coston2",
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    flareContractRegistry: FLARE_CONTRACT_REGISTRY,
    assetManagerFXRP: assetManagerAddress,
    fxrp: fxrpAddress,
    ftsoXrpUsdOracle: await oracle.getAddress(),
    milestoneFundingForwarder: await forwarder.getAddress(),
    milestoneEscrow: await escrow.getAddress(),
  };

  const outputDir = path.join(process.cwd(), "deployments");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "coston2.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(deployment, null, 2)}\n`);
  console.log(`Deployment manifest written to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
