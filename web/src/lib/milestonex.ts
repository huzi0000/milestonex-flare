import { formatUnits, type Address, type Hash } from "viem";
import { MilestoneEscrowArtifact } from "../generated/contracts";
import { deployment } from "../generated/deployment";
import { publicClient } from "./flare";
import type { MilestoneStatus, Project } from "./data";

type ChainProject = {
  client: Address;
  contractor: Address;
  metadataHash: Hash;
  totalUsdCents: bigint;
  fundedFxrp: bigint;
  releasedFxrp: bigint;
  milestoneCount: number;
  nextMilestone: number;
  status: number;
};

type ChainMilestone = {
  usdCents: bigint;
  evidenceHash: Hash;
  submitted: boolean;
  released: boolean;
};

const zeroHash = `0x${"0".repeat(64)}`;

const knownProjectDetails: Record<number, { title: string; description: string }> = {
  1: {
    title: "MilestoneX launch experience",
    description: "The first fully verified client-to-contractor FXRP milestone lifecycle.",
  },
};

export const projectOneTransactions = {
  created: "0x500275e4323d6be5dbeaf4aab96fab15deb53dba0e71b78fe2e3e3dbf638e30d",
  funded: "0x276027adad29a18938fec5e86488868121849eb9835965c2b9486884c6241415",
  evidence: "0x1d2e1c5f81025f0a0e9bb577b40040d87e4c7ef25a50bfb220de5680b9942121",
  released: "0x35b8db6dc90a44484a855827aca2802260b434119c844274f6c02c79270a5304",
} as const;

const verifiedProjectOne: Project = {
  id: 1,
  title: "MilestoneX launch experience",
  category: "Verified FXRP escrow",
  client: "0x7BbB50b3e38aac305d94C53CC239cF243E2608EF",
  contractor: "0x54CBc5f53e16fFFAc586a2B14Bf4D9d40866DF2F",
  metadataHash: "0xe3f355feb9872ae47bf3c0c45e8bfe69362605eb40954562b49614fdeaf6d981",
  totalUsdCents: 500,
  lockedFxrp: 4.663805,
  releasedFxrp: 4.663805,
  status: "completed",
  due: "Completed on Coston2",
  source: "live",
  contractAddress: deployment.milestoneEscrow,
  proof: projectOneTransactions,
  milestones: [
    {
      id: 0,
      title: "Live product delivery",
      description: "The first fully verified client-to-contractor FXRP milestone lifecycle.",
      usdCents: 500,
      evidenceHash: "0x45f078b58a630e8fa8a48532cd65f2f4a0286a741595df51c10cc5a342b0633d",
      due: "Completed",
      status: "paid",
    },
  ],
};

export function getVerifiedFallbackProjects(): Project[] {
  return [{ ...verifiedProjectOne, milestones: verifiedProjectOne.milestones.map((item) => ({ ...item })) }];
}

const projectStatus = (status: number): Project["status"] => {
  if (status === 2) return "funded";
  if (status === 3) return "completed";
  if (status === 4) return "cancelled";
  return "created";
};

const milestoneStatus = (
  milestone: ChainMilestone,
  index: number,
  nextMilestone: number,
): MilestoneStatus => {
  if (milestone.released) return "paid";
  if (milestone.submitted) return "submitted";
  if (index === nextMilestone) return "active";
  return "upcoming";
};

export async function getLiveProjects(): Promise<Project[]> {
  const nextProjectId = await publicClient.readContract({
    address: deployment.milestoneEscrow,
    abi: MilestoneEscrowArtifact.abi,
    functionName: "nextProjectId",
  }) as bigint;

  const lastId = Number(nextProjectId - 1n);
  if (lastId < 1) return [];
  const firstId = Math.max(1, lastId - 19);

  const projects = await Promise.all(
    Array.from({ length: lastId - firstId + 1 }, (_, offset) => firstId + offset).map(
      async (id): Promise<Project> => {
        const chainProject = await publicClient.readContract({
          address: deployment.milestoneEscrow,
          abi: MilestoneEscrowArtifact.abi,
          functionName: "getProject",
          args: [BigInt(id)],
        }) as unknown as ChainProject;

        const chainMilestones = await Promise.all(
          Array.from({ length: Number(chainProject.milestoneCount) }, (_, index) =>
            publicClient.readContract({
              address: deployment.milestoneEscrow,
              abi: MilestoneEscrowArtifact.abi,
              functionName: "getMilestone",
              args: [BigInt(id), BigInt(index)],
            }) as Promise<unknown> as Promise<ChainMilestone>,
          ),
        );

        const detail = knownProjectDetails[id] ?? {
          title: `Coston2 project #${id}`,
          description: "A live FXRP milestone project recorded by the deployed escrow.",
        };

        return {
          id,
          title: detail.title,
          category: "Live FXRP escrow",
          client: chainProject.client,
          contractor: chainProject.contractor,
          metadataHash: chainProject.metadataHash,
          totalUsdCents: Number(chainProject.totalUsdCents),
          lockedFxrp: Number(formatUnits(chainProject.fundedFxrp, 6)),
          releasedFxrp: Number(formatUnits(chainProject.releasedFxrp, 6)),
          status: projectStatus(Number(chainProject.status)),
          due: chainProject.status === 3 ? "Completed on Coston2" : "Live on Coston2",
          source: "live",
          contractAddress: deployment.milestoneEscrow,
          proof:
            id === 1
              ? projectOneTransactions
              : undefined,
          milestones: chainMilestones.map((milestone, index) => ({
            id: index,
            title:
              id === 1
                ? "Live product delivery"
                : `Milestone ${index + 1}`,
            description:
              id === 1
                ? detail.description
                : "Deliverable committed to the live MilestoneX escrow.",
            usdCents: Number(milestone.usdCents),
            evidenceHash:
              milestone.evidenceHash.toLowerCase() === zeroHash
                ? undefined
                : milestone.evidenceHash,
            due: chainProject.status === 3 ? "Completed" : "Onchain",
            status: milestoneStatus(
              milestone,
              index,
              Number(chainProject.nextMilestone),
            ),
          })),
        };
      },
    ),
  );

  return projects.reverse();
}
