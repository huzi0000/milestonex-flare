const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const outputPath = path.resolve(root, "../web/src/generated/contracts.ts");
const contracts = [
  ["FtsoXrpUsdOracle", "artifacts/contracts/FtsoXrpUsdOracle.sol/FtsoXrpUsdOracle.json"],
  ["MilestoneFundingForwarder", "artifacts/contracts/MilestoneFundingForwarder.sol/MilestoneFundingForwarder.json"],
  ["MilestoneEscrow", "artifacts/contracts/MilestoneEscrow.sol/MilestoneEscrow.json"],
];

const lines = [
  "// Generated from audited local Hardhat artifacts. Do not edit by hand.",
  "// Run `npm run export:web` in /contracts after every contract change.",
  "",
];

for (const [name, relativePath] of contracts) {
  const artifact = JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  if (!artifact.bytecode || artifact.bytecode === "0x") {
    throw new Error(`${name} artifact has no deployable bytecode.`);
  }
  lines.push(`export const ${name}Artifact = {`);
  lines.push(`  abi: ${JSON.stringify(artifact.abi, null, 2)},`);
  lines.push(`  bytecode: ${JSON.stringify(artifact.bytecode)},`);
  lines.push("} as const;");
  lines.push("");
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
console.log(`Wrote ${outputPath}`);
