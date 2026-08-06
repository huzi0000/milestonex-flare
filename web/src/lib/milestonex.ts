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
const RECEIPT_STORAGE_KEY = "milestonex:lifecycle-receipts";

export type LifecycleReceiptKey = "created" | "funded" | "evidence" | "released";
export type StoredLifecycleReceipt = { hash: Hash; blockNumber: number };
export type StoredLifecycleReceipts = Record<string, Partial<Record<LifecycleReceiptKey, StoredLifecycleReceipt>>>;

export function getStoredLifecycleReceipts(): StoredLifecycleReceipts {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(RECEIPT_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed as StoredLifecycleReceipts : {};
  } catch {
    return {};
  }
}

export function saveLifecycleReceipt(
  projectId: bigint,
  key: LifecycleReceiptKey,
  hash: Hash,
  blockNumber: bigint,
) {
  if (typeof window === "undefined") return;
  const receipts = getStoredLifecycleReceipts();
  const id = projectId.toString();
  receipts[id] = {
    ...(receipts[id] ?? {}),
    [key]: { hash, blockNumber: Number(blockNumber) },
  };
  localStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(receipts));
}

const knownProjectDetails: Record<number, { title: string; description: string }> = {
  1: {
    title: "MilestoneX launch experience",
    description: "The first fully verified client-to-contractor FXRP milestone lifecycle.",
  },
  2: {
    title: "MilestoneX practice project",
    description: "A second machine-verified lifecycle proving repeatable FXRP settlement.",
  },
  3: {
    title: "MilestoneX demo project #3",
    description: "A third machine-verified lifecycle completed with fresh client and contractor accounts.",
  },
};

export const projectOneTransactions = {
  created: "0x500275e4323d6be5dbeaf4aab96fab15deb53dba0e71b78fe2e3e3dbf638e30d",
  funded: "0x276027adad29a18938fec5e86488868121849eb9835965c2b9486884c6241415",
  evidence: "0x1d2e1c5f81025f0a0e9bb577b40040d87e4c7ef25a50bfb220de5680b9942121",
  released: "0x35b8db6dc90a44484a855827aca2802260b434119c844274f6c02c79270a5304",
} as const;

export const projectTwoTransactions = {
  created: "0x330429e13aa0e6782d70bfe4c3114a19342bf5c5c49eac7654f73d63a335159c",
  funded: "0xdc2835f38843401546a43536c8ecc33a152646f4c468904ed11c162f33f91bc6",
  evidence: "0x603c441242aa2b84a72c672aed3c60470cfe9dbfede84e9ca40f3e37ef3f2b52",
  released: "0x876d2486c05d7397ae97c6f72d0d3c659bfbaf6606be94711fcff6e51b443867",
} as const;

export const projectThreeTransactions = {
  created: "0x5fdf4ee0855dda674c6ac7494fdd5d50e9f4ea9af54afe6fbd395ee7e4531131",
  funded: "0x9e240aa724f1372e4d59ce4efe043356e8cd601f54ecde004cc4d580a83fecb1",
  evidence: "0xfa8958c50418b7847396c59baacb61cc657fb72c87cf4221d9c22d6b2ed62b4b",
  released: "0x4fc3432a6fa2f9199f329ae6f457c6aa81b0552113432db4bf28b7fd54c6826b",
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

const verifiedProjectTwo: Project = {
  id: 2,
  title: "MilestoneX practice project",
  category: "Verified FXRP escrow",
  client: "0x7BbB50b3e38aac305d94C53CC239cF243E2608EF",
  contractor: "0x54CBc5f53e16fFFAc586a2B14Bf4D9d40866DF2F",
  metadataHash: "0x13a5de78e3712104b227b0ed9be382d6aecc2d00acb933b58ae292f266655194",
  totalUsdCents: 50,
  lockedFxrp: 0.469552,
  releasedFxrp: 0.469552,
  status: "completed",
  due: "Completed on Coston2",
  source: "live",
  contractAddress: deployment.milestoneEscrow,
  proof: projectTwoTransactions,
  milestones: [
    {
      id: 0,
      title: "Practice lifecycle delivery",
      description: "A second machine-verified lifecycle proving repeatable FXRP settlement.",
      usdCents: 50,
      evidenceHash: "0x45f078b58a630e8fa8a48532cd65f2f4a0286a741595df51c10cc5a342b0633d",
      due: "Completed",
      status: "paid",
    },
  ],
};

const verifiedProjectThree: Project = {
  id: 3,
  title: "MilestoneX demo project #3",
  category: "Verified FXRP escrow",
  client: "0xfCbDDcBA8b0A976f9117c6af3867480d626f176C",
  contractor: "0x772093a7Fe4D33774Aa49F13B97E8e18E271B0cf",
  metadataHash: "0x1e985f91e4eb5e5352e472e5d8389667c1b1365b291b8523be000e9402a3bb10",
  totalUsdCents: 300,
  lockedFxrp: 2.859442,
  releasedFxrp: 2.859442,
  status: "completed",
  due: "Completed on Coston2",
  source: "live",
  contractAddress: deployment.milestoneEscrow,
  proof: projectThreeTransactions,
  milestones: [
    {
      id: 0,
      title: "Demo lifecycle delivery",
      description: "A third machine-verified lifecycle completed with fresh client and contractor accounts.",
      usdCents: 300,
      evidenceHash: "0xf1ea7530d284b77f9bb897084864641f260844997d6c42cc6ecf76ceb4354538",
      due: "Completed",
      status: "paid",
    },
  ],
};

export function getVerifiedFallbackProjects(): Project[] {
  return [verifiedProjectOne, verifiedProjectTwo, verifiedProjectThree].map((project) => ({
    ...project,
    milestones: project.milestones.map((item) => ({ ...item })),
  }));
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
              : id === 2
                ? projectTwoTransactions
                : id === 3
                  ? projectThreeTransactions
                  : undefined,
          milestones: chainMilestones.map((milestone, index) => ({
            id: index,
            title:
              id === 1
                ? "Live product delivery"
                : id === 2
                  ? "Practice lifecycle delivery"
                  : id === 3
                    ? "Demo lifecycle delivery"
                    : `Milestone ${index + 1}`,
            description:
              id === 1 || id === 2 || id === 3
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
