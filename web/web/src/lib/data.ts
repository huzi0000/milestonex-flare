export type MilestoneStatus = "paid" | "submitted" | "active" | "upcoming";

export type Milestone = {
  id: number;
  title: string;
  description: string;
  usdCents: number;
  evidenceHash?: string;
  due: string;
  status: MilestoneStatus;
};

export type Project = {
  id: number;
  title: string;
  category: string;
  client: string;
  contractor: string;
  metadataHash: string;
  totalUsdCents: number;
  lockedFxrp: number;
  releasedFxrp: number;
  status: "funded" | "created" | "completed" | "cancelled";
  due: string;
  source?: "live" | "demo";
  contractAddress?: string;
  proof?: {
    created: string;
    funded: string;
    evidence: string;
    released: string;
  };
  milestones: Milestone[];
};

export const demoProjects: Project[] = [
  {
    id: 1,
    title: "Commerce dashboard redesign",
    category: "Product design & development",
    client: "0x17A9b7E81D40c01296F91b7A1306AcC3819A7F3B",
    contractor: "0x8C5dD3c7B2C54A04d7782A321Dca1130bA0156e2",
    metadataHash: "0xa72e22d58dc9e7b3c7f67e86a78356c1567c443abeddb9448ba88f2f638727bc",
    totalUsdCents: 240000,
    lockedFxrp: 2234.86,
    releasedFxrp: 782.2,
    status: "funded",
    due: "Aug 22, 2026",
    source: "demo",
    milestones: [
      {
        id: 0,
        title: "Research & information architecture",
        description: "User flows, content model, and approved low-fidelity direction.",
        usdCents: 84000,
        evidenceHash: "0x9fa6…1c40",
        due: "Aug 7",
        status: "paid",
      },
      {
        id: 1,
        title: "Interface design system",
        description: "Responsive components, tokens, and high-fidelity core screens.",
        usdCents: 96000,
        evidenceHash: "0x7d82…b118",
        due: "Aug 14",
        status: "submitted",
      },
      {
        id: 2,
        title: "Production handoff",
        description: "Final responsive build, QA fixes, and implementation notes.",
        usdCents: 60000,
        due: "Aug 22",
        status: "upcoming",
      },
    ],
  },
  {
    id: 2,
    title: "Research assistant MVP",
    category: "AI product development",
    client: "0x17A9b7E81D40c01296F91b7A1306AcC3819A7F3B",
    contractor: "0x0D2aF48Ce01c19F36E6E93A3Cb9632d769E8d519",
    metadataHash: "0x22f49a288a08beddf9f88ca9f858eec5fb441ab7dfa6548eced5f5d571ea2be7",
    totalUsdCents: 180000,
    lockedFxrp: 1676.14,
    releasedFxrp: 0,
    status: "funded",
    due: "Sep 4, 2026",
    source: "demo",
    milestones: [
      {
        id: 0,
        title: "Retrieval pipeline",
        description: "Document ingestion, chunking, retrieval, and evaluation harness.",
        usdCents: 60000,
        due: "Aug 16",
        status: "active",
      },
      {
        id: 1,
        title: "Application workflow",
        description: "Research workspace, citations, export, and feedback controls.",
        usdCents: 80000,
        due: "Aug 27",
        status: "upcoming",
      },
      {
        id: 2,
        title: "Deployment and QA",
        description: "Production deployment, monitoring, tests, and documentation.",
        usdCents: 40000,
        due: "Sep 4",
        status: "upcoming",
      },
    ],
  },
  {
    id: 3,
    title: "Brand launch microsite",
    category: "Web development",
    client: "0x44E874Bf2A8395E36Bc301b045A0A772fbeAA670",
    contractor: "0x8C5dD3c7B2C54A04d7782A321Dca1130bA0156e2",
    metadataHash: "0xb620e50a2af28f8d2e471194b2ec00cc48abaf7db9baea1a69b3433d810f504f",
    totalUsdCents: 95000,
    lockedFxrp: 884.08,
    releasedFxrp: 884.08,
    status: "completed",
    due: "Jul 28, 2026",
    source: "demo",
    milestones: [
      {
        id: 0,
        title: "Creative direction",
        description: "Visual system and interactive prototype.",
        usdCents: 35000,
        evidenceHash: "0x01b2…779a",
        due: "Jul 20",
        status: "paid",
      },
      {
        id: 1,
        title: "Build and launch",
        description: "Responsive implementation, QA, and launch.",
        usdCents: 60000,
        evidenceHash: "0xa912…77e0",
        due: "Jul 28",
        status: "paid",
      },
    ],
  },
];

export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export const fxrp = (value: number) =>
  `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} FXRP`;
