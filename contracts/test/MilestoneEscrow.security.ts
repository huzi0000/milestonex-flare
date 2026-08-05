import { expect } from "chai";
import { ethers } from "hardhat";

const FXRP = 10n ** 6n;
const USD = 10n ** 18n;
const PRICE = 125n * USD / 100n; // $1.25/XRP
const metadata = (label: string) => ethers.keccak256(ethers.toUtf8Bytes(label));
const evidence = (label: string) => ethers.keccak256(ethers.toUtf8Bytes(label));

async function fixture() {
  const [client, contractor, outsider, relayer, secondContractor] = await ethers.getSigners();
  const token = await ethers.deployContract("MockFxrp");
  const oracle = await ethers.deployContract("MockXrpUsdOracle", [PRICE]);
  const forwarder = await ethers.deployContract("MilestoneFundingForwarder");
  const escrow = await ethers.deployContract("MilestoneEscrow", [
    await token.getAddress(),
    await oracle.getAddress(),
    await forwarder.getAddress(),
  ]);

  await token.mint(client.address, 10_000n * FXRP);
  await token.connect(client).approve(await escrow.getAddress(), ethers.MaxUint256);

  return {
    client,
    contractor,
    outsider,
    relayer,
    secondContractor,
    token,
    oracle,
    forwarder,
    escrow,
  };
}

async function createAndFund(
  setup: Awaited<ReturnType<typeof fixture>>,
  amounts: bigint[],
  contractor = setup.contractor,
) {
  const { client, escrow } = setup;
  const projectId = await escrow.nextProjectId();
  await escrow
    .connect(client)
    .createProject(contractor.address, metadata(`project-${projectId}`), amounts);
  const project = await escrow.getProject(projectId);
  const [quote] = await escrow.quoteUsdCents(project.totalUsdCents);
  await escrow.connect(client).fundProject(projectId, quote);
  return { projectId, quote };
}

async function signFunding(
  setup: Awaited<ReturnType<typeof fixture>>,
  values: {
    escrow?: string;
    client?: string;
    projectId: bigint;
    maximumFxrpAmount: bigint;
    nonce?: bigint;
    deadline: bigint;
  },
  signer = setup.client,
) {
  const network = await ethers.provider.getNetwork();
  const domain = {
    name: "MilestoneXFundingForwarder",
    version: "1",
    chainId: network.chainId,
    verifyingContract: await setup.forwarder.getAddress(),
  };
  const types = {
    FundProject: [
      { name: "escrow", type: "address" },
      { name: "client", type: "address" },
      { name: "projectId", type: "uint256" },
      { name: "maximumFxrpAmount", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };
  const message = {
    escrow: values.escrow ?? (await setup.escrow.getAddress()),
    client: values.client ?? setup.client.address,
    projectId: values.projectId,
    maximumFxrpAmount: values.maximumFxrpAmount,
    nonce: values.nonce ?? (await setup.forwarder.nonces(setup.client.address)),
    deadline: values.deadline,
  };
  return {
    message,
    signature: await signer.signTypedData(domain, types, message),
  };
}

async function assertEscrowAccounting(
  setup: Awaited<ReturnType<typeof fixture>>,
  projectIds: bigint[],
) {
  let obligations = 0n;
  for (const id of projectIds) {
    const project = await setup.escrow.getProject(id);
    if (project.status === 2n) obligations += project.fundedFxrp - project.releasedFxrp;
  }
  expect(await setup.token.balanceOf(await setup.escrow.getAddress())).to.equal(obligations);
}

describe("MilestoneEscrow security and invariants", function () {
  it("rejects zero constructor dependencies", async function () {
    const { token, oracle, forwarder } = await fixture();
    const factory = await ethers.getContractFactory("MilestoneEscrow");
    await expect(
      factory.deploy(ethers.ZeroAddress, await oracle.getAddress(), await forwarder.getAddress()),
    ).to.be.revertedWithCustomError(factory, "InvalidAddress");
    await expect(
      factory.deploy(await token.getAddress(), ethers.ZeroAddress, await forwarder.getAddress()),
    ).to.be.revertedWithCustomError(factory, "InvalidAddress");
    await expect(
      factory.deploy(await token.getAddress(), await oracle.getAddress(), ethers.ZeroAddress),
    ).to.be.revertedWithCustomError(factory, "InvalidAddress");
  });

  it("rejects invalid contractor, metadata, milestone count, and zero amounts", async function () {
    const { client, contractor, escrow } = await fixture();
    await expect(
      escrow.connect(client).createProject(ethers.ZeroAddress, metadata("a"), [100n]),
    ).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    await expect(
      escrow.connect(client).createProject(client.address, metadata("a"), [100n]),
    ).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    await expect(
      escrow.connect(client).createProject(contractor.address, ethers.ZeroHash, [100n]),
    ).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    await expect(
      escrow.connect(client).createProject(contractor.address, metadata("empty"), []),
    ).to.be.revertedWithCustomError(escrow, "InvalidMilestones");
    await expect(
      escrow.connect(client).createProject(contractor.address, metadata("zero"), [100n, 0n]),
    ).to.be.revertedWithCustomError(escrow, "InvalidMilestones");
    await expect(
      escrow
        .connect(client)
        .createProject(contractor.address, metadata("too-many"), Array(13).fill(100n)),
    ).to.be.revertedWithCustomError(escrow, "InvalidMilestones");
  });

  it("rejects zero, stale, and future-dated oracle values", async function () {
    const { oracle, escrow } = await fixture();
    await oracle.setPrice(0n);
    await expect(escrow.quoteUsdCents(100n)).to.be.revertedWithCustomError(
      escrow,
      "InvalidOraclePrice",
    );

    await oracle.setPrice(PRICE);
    const block = await ethers.provider.getBlock("latest");
    await oracle.setUpdatedAt(BigInt((block?.timestamp ?? 0) - 901));
    await expect(escrow.quoteUsdCents(100n)).to.be.revertedWithCustomError(
      escrow,
      "StaleOraclePrice",
    );

    await oracle.setUpdatedAt(BigInt((block?.timestamp ?? 0) + 60));
    await expect(escrow.quoteUsdCents(100n)).to.be.revertedWithCustomError(
      escrow,
      "StaleOraclePrice",
    );
  });

  it("rounds funding requirements upward to prevent underfunding", async function () {
    const { oracle, escrow } = await fixture();
    await oracle.setPrice(3n * USD); // $3/XRP
    const [quote] = await escrow.quoteUsdCents(100n); // $1
    expect(quote).to.equal(333_334n); // 0.333334 FXRP, rounded up
  });

  it("blocks unauthorized and duplicate funding", async function () {
    const setup = await fixture();
    const { client, contractor, outsider, escrow } = setup;
    await escrow
      .connect(client)
      .createProject(contractor.address, metadata("fund-auth"), [10_000n]);
    const [quote] = await escrow.quoteUsdCents(10_000n);
    await expect(
      escrow.connect(outsider).fundProject(1n, quote),
    ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    await escrow.connect(client).fundProject(1n, quote);
    await expect(
      escrow.connect(client).fundProject(1n, quote),
    ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
  });

  it("enforces contractor-only evidence, sequence, and nonzero hashes", async function () {
    const setup = await fixture();
    const { client, contractor, outsider, escrow } = setup;
    const { projectId } = await createAndFund(setup, [4_000n, 6_000n]);
    await expect(
      escrow.connect(client).submitEvidence(projectId, 0n, evidence("x")),
    ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    await expect(
      escrow.connect(outsider).submitEvidence(projectId, 0n, evidence("x")),
    ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    await expect(
      escrow.connect(contractor).submitEvidence(projectId, 1n, evidence("x")),
    ).to.be.revertedWithCustomError(escrow, "InvalidMilestoneOrder");
    await expect(
      escrow.connect(contractor).submitEvidence(projectId, 0n, ethers.ZeroHash),
    ).to.be.revertedWithCustomError(escrow, "InvalidEvidence");
  });

  it("enforces client-only release and requires submitted evidence", async function () {
    const setup = await fixture();
    const { client, contractor, outsider, escrow } = setup;
    const { projectId } = await createAndFund(setup, [10_000n]);
    await expect(
      escrow.connect(client).releaseMilestone(projectId, 0n),
    ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    await escrow.connect(contractor).submitEvidence(projectId, 0n, evidence("done"));
    await expect(
      escrow.connect(outsider).releaseMilestone(projectId, 0n),
    ).to.be.revertedWithCustomError(escrow, "Unauthorized");
  });

  it("releases multiple milestones exactly and assigns rounding dust to the final milestone", async function () {
    const setup = await fixture();
    const { client, contractor, token, escrow } = setup;
    const { projectId, quote } = await createAndFund(setup, [3_333n, 3_333n, 3_334n]);
    const expectedFirst = (quote * 3_333n) / 10_000n;
    const expectedSecond = expectedFirst;
    const expectedLast = quote - expectedFirst - expectedSecond;

    for (let index = 0n; index < 3n; index++) {
      await escrow
        .connect(contractor)
        .submitEvidence(projectId, index, evidence(`milestone-${index}`));
      const before = await token.balanceOf(contractor.address);
      await escrow.connect(client).releaseMilestone(projectId, index);
      const after = await token.balanceOf(contractor.address);
      expect(after - before).to.equal(
        index === 0n ? expectedFirst : index === 1n ? expectedSecond : expectedLast,
      );
      await assertEscrowAccounting(setup, [projectId]);
    }

    const project = await escrow.getProject(projectId);
    expect(project.releasedFxrp).to.equal(quote);
    expect(project.status).to.equal(3n);
    expect(await token.balanceOf(await escrow.getAddress())).to.equal(0n);
  });

  it("requires mutual cancellation and refunds only unreleased obligations", async function () {
    const setup = await fixture();
    const { client, contractor, outsider, token, escrow } = setup;
    const { projectId, quote } = await createAndFund(setup, [4_000n, 6_000n]);

    await escrow
      .connect(contractor)
      .submitEvidence(projectId, 0n, evidence("first-delivery"));
    await escrow.connect(client).releaseMilestone(projectId, 0n);
    const released = (quote * 4_000n) / 10_000n;
    const remaining = quote - released;

    await expect(
      escrow.connect(outsider).approveCancellation(projectId),
    ).to.be.revertedWithCustomError(escrow, "Unauthorized");

    const clientBefore = await token.balanceOf(client.address);
    await escrow.connect(client).approveCancellation(projectId);
    expect(await token.balanceOf(await escrow.getAddress())).to.equal(remaining);
    expect((await escrow.getProject(projectId)).status).to.equal(2n);

    await escrow.connect(contractor).approveCancellation(projectId);
    expect(await token.balanceOf(client.address)).to.equal(clientBefore + remaining);
    expect(await token.balanceOf(contractor.address)).to.equal(released);
    expect((await escrow.getProject(projectId)).status).to.equal(4n);
    expect(await token.balanceOf(await escrow.getAddress())).to.equal(0n);
  });

  it("maintains the global escrow-balance invariant across concurrent projects", async function () {
    const setup = await fixture();
    const first = await createAndFund(setup, [4_000n, 6_000n]);
    const second = await createAndFund(setup, [5_000n, 5_000n], setup.secondContractor);
    await assertEscrowAccounting(setup, [first.projectId, second.projectId]);

    await setup.escrow
      .connect(setup.contractor)
      .submitEvidence(first.projectId, 0n, evidence("first"));
    await setup.escrow.connect(setup.client).releaseMilestone(first.projectId, 0n);
    await assertEscrowAccounting(setup, [first.projectId, second.projectId]);

    await setup.escrow.connect(setup.client).approveCancellation(second.projectId);
    await setup.escrow
      .connect(setup.secondContractor)
      .approveCancellation(second.projectId);
    await assertEscrowAccounting(setup, [first.projectId, second.projectId]);

    await setup.escrow
      .connect(setup.contractor)
      .submitEvidence(first.projectId, 1n, evidence("second"));
    await setup.escrow.connect(setup.client).releaseMilestone(first.projectId, 1n);
    await assertEscrowAccounting(setup, [first.projectId, second.projectId]);
    expect(await setup.token.balanceOf(await setup.escrow.getAddress())).to.equal(0n);
  });

  it("rejects expired and wrong-signer EIP-712 authorizations", async function () {
    const setup = await fixture();
    const { client, contractor, outsider, relayer, escrow, forwarder } = setup;
    await escrow
      .connect(client)
      .createProject(contractor.address, metadata("forwarder"), [10_000n]);
    const [quote] = await escrow.quoteUsdCents(10_000n);
    const block = await ethers.provider.getBlock("latest");

    const expired = await signFunding(setup, {
      projectId: 1n,
      maximumFxrpAmount: quote,
      deadline: BigInt((block?.timestamp ?? 0) - 1),
    });
    await expect(
      forwarder
        .connect(relayer)
        .executeFunding(
          expired.message.escrow,
          expired.message.client,
          1n,
          quote,
          expired.message.deadline,
          expired.signature,
        ),
    ).to.be.revertedWithCustomError(forwarder, "ExpiredAuthorization");

    const wrongSigner = await signFunding(
      setup,
      {
        projectId: 1n,
        maximumFxrpAmount: quote,
        deadline: BigInt((block?.timestamp ?? 0) + 3_600),
      },
      outsider,
    );
    await expect(
      forwarder
        .connect(relayer)
        .executeFunding(
          wrongSigner.message.escrow,
          wrongSigner.message.client,
          1n,
          quote,
          wrongSigner.message.deadline,
          wrongSigner.signature,
        ),
    ).to.be.revertedWithCustomError(forwarder, "InvalidSigner");
  });

  it("binds signatures to escrow, client, project, amount, nonce, and chain", async function () {
    const setup = await fixture();
    const { client, contractor, relayer, escrow, forwarder } = setup;
    await escrow
      .connect(client)
      .createProject(contractor.address, metadata("binding"), [10_000n]);
    const [quote] = await escrow.quoteUsdCents(10_000n);
    const block = await ethers.provider.getBlock("latest");
    const signed = await signFunding(setup, {
      projectId: 1n,
      maximumFxrpAmount: quote,
      deadline: BigInt((block?.timestamp ?? 0) + 3_600),
    });

    await expect(
      forwarder
        .connect(relayer)
        .executeFunding(
          signed.message.escrow,
          signed.message.client,
          1n,
          quote + 1n,
          signed.message.deadline,
          signed.signature,
        ),
    ).to.be.revertedWithCustomError(forwarder, "InvalidSigner");
  });
});
