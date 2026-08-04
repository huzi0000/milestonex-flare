import {
  Contract,
  Interface,
  JsonRpcProvider,
  formatUnits,
  type InterfaceAbi,
  type Log,
} from "ethers";
import fs from "node:fs";
import path from "node:path";

type Manifest = {
  chainId: number;
  fxrp: string;
  milestoneEscrow: string;
  transactions: { escrow: string };
};

type ParsedEvent = {
  name: string;
  transactionHash: string;
  blockNumber: number;
  args: Record<string, string | boolean>;
};

const PROJECT_ID = BigInt(process.env.PROJECT_ID ?? "1");
const RPC = process.env.COSTON2_RPC_URL ?? "https://coston2-api.flare.network/ext/C/rpc";

function serialise(value: unknown): string | boolean {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "boolean") return value;
  return String(value);
}

async function main() {
  const root = process.cwd();
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "deployments/coston2.json"), "utf8"),
  ) as Manifest;
  const artifact = JSON.parse(
    fs.readFileSync(
      path.join(root, "artifacts/contracts/MilestoneEscrow.sol/MilestoneEscrow.json"),
      "utf8",
    ),
  ) as { abi: InterfaceAbi };

  const provider = new JsonRpcProvider(RPC, 114);
  const network = await provider.getNetwork();
  if (network.chainId !== 114n || manifest.chainId !== 114) {
    throw new Error("Expected Coston2 chain ID 114.");
  }

  const escrow = new Contract(manifest.milestoneEscrow, artifact.abi, provider);
  const token = new Contract(
    manifest.fxrp,
    [
      "function balanceOf(address) view returns (uint256)",
      "event Transfer(address indexed from,address indexed to,uint256 value)",
    ],
    provider,
  );

  const project = await escrow.getProject(PROJECT_ID);
  const milestone = await escrow.getMilestone(PROJECT_ID, 0n);
  if (Number(project.status) === 0) throw new Error(`Project ${PROJECT_ID} does not exist.`);

  const deployReceipt = await provider.getTransactionReceipt(manifest.transactions.escrow);
  if (!deployReceipt) throw new Error("Escrow deployment receipt unavailable.");
  const latestBlock = await provider.getBlockNumber();
  // The public Coston2 RPC limits eth_getLogs to 30 blocks per request.
  const logs: Log[] = [];
  for (let fromBlock = deployReceipt.blockNumber; fromBlock <= latestBlock; fromBlock += 30) {
    const toBlock = Math.min(fromBlock + 29, latestBlock);
    logs.push(
      ...(await provider.getLogs({
        address: manifest.milestoneEscrow,
        fromBlock,
        toBlock,
      })),
    );
  }

  const iface = new Interface(artifact.abi);
  const events: ParsedEvent[] = [];
  for (const log of logs) {
    try {
      const parsed = iface.parseLog(log);
      if (!parsed || parsed.args.length === 0 || BigInt(parsed.args[0]) !== PROJECT_ID) continue;
      const namedArgs: Record<string, string | boolean> = {};
      parsed.fragment.inputs.forEach((input, index) => {
        namedArgs[input.name || String(index)] = serialise(parsed.args[index]);
      });
      events.push({
        name: parsed.name,
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        args: namedArgs,
      });
    } catch {
      // Ignore logs that are not part of the escrow ABI.
    }
  }

  const event = (name: string) => events.find((item) => item.name === name);
  const required = [
    "ProjectCreated",
    "ProjectFunded",
    "EvidenceSubmitted",
    "MilestoneReleased",
    "ProjectCompleted",
  ];
  for (const name of required) {
    if (!event(name)) throw new Error(`Missing required event: ${name}`);
  }

  const releaseEvent = event("MilestoneReleased")!;
  const releaseReceipt = await provider.getTransactionReceipt(releaseEvent.transactionHash);
  if (!releaseReceipt || releaseReceipt.status !== 1) {
    throw new Error("Release transaction is not successful.");
  }
  const tokenInterface = new Interface([
    "event Transfer(address indexed from,address indexed to,uint256 value)",
  ]);
  const releaseTransfers = releaseReceipt.logs
    .filter((log) => log.address.toLowerCase() === manifest.fxrp.toLowerCase())
    .flatMap((log) => {
      try {
        const parsed = tokenInterface.parseLog(log);
        if (!parsed) return [];
        return [{
          from: String(parsed.args.from),
          to: String(parsed.args.to),
          value: BigInt(parsed.args.value),
        }];
      } catch {
        return [];
      }
    });

  const escrowBalance = await token.balanceOf(manifest.milestoneEscrow);
  const funded = BigInt(project.fundedFxrp);
  const released = BigInt(project.releasedFxrp);
  const releaseTransfer = releaseTransfers.find(
    (item) =>
      item.from.toLowerCase() === manifest.milestoneEscrow.toLowerCase() &&
      item.to.toLowerCase() === String(project.contractor).toLowerCase(),
  );

  const checks = {
    projectExists: Number(project.status) > 0,
    statusCompleted: Number(project.status) === 3,
    oneMilestone: Number(project.milestoneCount) === 1,
    milestoneSequenceComplete: Number(project.nextMilestone) === 1,
    evidenceSubmitted: Boolean(milestone.submitted),
    milestoneReleased: Boolean(milestone.released),
    evidenceHashPresent: String(milestone.evidenceHash) !== `0x${"0".repeat(64)}`,
    fullyReleased: funded > 0n && funded === released,
    releaseTransferFound: Boolean(releaseTransfer && releaseTransfer.value === released),
    escrowBalanceZero: BigInt(escrowBalance) === 0n,
    allRequiredEvents: required.every((name) => Boolean(event(name))),
  };
  if (Object.values(checks).some((value) => !value)) {
    throw new Error(`Lifecycle verification failed: ${JSON.stringify(checks)}`);
  }

  const output = {
    verified: true,
    chainId: network.chainId.toString(),
    projectId: PROJECT_ID.toString(),
    latestBlock,
    project: {
      client: project.client,
      contractor: project.contractor,
      metadataHash: project.metadataHash,
      totalUsdCents: project.totalUsdCents.toString(),
      fundedFxrp: funded.toString(),
      fundedFxrpFormatted: formatUnits(funded, 6),
      releasedFxrp: released.toString(),
      releasedFxrpFormatted: formatUnits(released, 6),
      milestoneCount: project.milestoneCount.toString(),
      nextMilestone: project.nextMilestone.toString(),
      status: project.status.toString(),
      statusLabel: "Completed",
    },
    milestone: {
      usdCents: milestone.usdCents.toString(),
      evidenceHash: milestone.evidenceHash,
      submitted: milestone.submitted,
      released: milestone.released,
    },
    events,
    releaseTransfer: releaseTransfer
      ? {
          from: releaseTransfer.from,
          to: releaseTransfer.to,
          value: releaseTransfer.value.toString(),
          formatted: formatUnits(releaseTransfer.value, 6),
        }
      : null,
    escrowFxrpBalance: escrowBalance.toString(),
    checks,
  };

  const outputPath = path.join(
    root,
    `deployments/project-${PROJECT_ID.toString()}-verification.json`,
  );
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
