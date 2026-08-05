import { expect } from "chai";
import { ethers } from "hardhat";

const FXRP = 10n ** 6n;
const USD = 10n ** 18n;

async function fixture() {
  const [client, contractor, outsider] = await ethers.getSigners();

  const token = await ethers.deployContract("MockFxrp");
  const oracle = await ethers.deployContract("MockXrpUsdOracle", [125n * USD / 100n]); // $1.25/XRP
  const forwarder = await ethers.deployContract("MilestoneFundingForwarder");
  const escrow = await ethers.deployContract("MilestoneEscrow", [
    await token.getAddress(),
    await oracle.getAddress(),
    await forwarder.getAddress(),
  ]);

  await token.mint(client.address, 1_000n * FXRP);
  await token.connect(client).approve(await escrow.getAddress(), ethers.MaxUint256);

  return { client, contractor, outsider, token, oracle, forwarder, escrow };
}

describe("MilestoneEscrow", function () {
  it("quotes USD cents into six-decimal FXRP using the oracle", async function () {
    const { escrow } = await fixture();
    const [amount, price] = await escrow.quoteUsdCents(10_000n); // $100

    expect(price).to.equal(125n * USD / 100n);
    expect(amount).to.equal(80n * FXRP);
  });

  it("funds and releases a complete project milestone by milestone", async function () {
    const { client, contractor, token, escrow } = await fixture();
    const metadata = ethers.keccak256(ethers.toUtf8Bytes("ipfs://project"));

    await expect(
      escrow.connect(client).createProject(contractor.address, metadata, [4_000n, 6_000n]),
    ).to.emit(escrow, "ProjectCreated");

    await expect(escrow.connect(client).fundProject(1n, 81n * FXRP))
      .to.emit(escrow, "ProjectFunded")
      .withArgs(1n, 80n * FXRP, 125n * USD / 100n);

    expect(await token.balanceOf(await escrow.getAddress())).to.equal(80n * FXRP);

    const evidenceOne = ethers.keccak256(ethers.toUtf8Bytes("milestone-one"));
    await escrow.connect(contractor).submitEvidence(1n, 0n, evidenceOne);
    await expect(escrow.connect(client).releaseMilestone(1n, 0n))
      .to.emit(escrow, "MilestoneReleased")
      .withArgs(1n, 0n, 32n * FXRP);

    const evidenceTwo = ethers.keccak256(ethers.toUtf8Bytes("milestone-two"));
    await escrow.connect(contractor).submitEvidence(1n, 1n, evidenceTwo);
    await expect(escrow.connect(client).releaseMilestone(1n, 1n))
      .to.emit(escrow, "ProjectCompleted")
      .withArgs(1n);

    expect(await token.balanceOf(contractor.address)).to.equal(80n * FXRP);
    expect(await token.balanceOf(await escrow.getAddress())).to.equal(0n);

    const project = await escrow.getProject(1n);
    expect(project.status).to.equal(3n); // Completed
    expect(project.releasedFxrp).to.equal(80n * FXRP);
  });

  it("protects the client from quote slippage", async function () {
    const { client, contractor, escrow } = await fixture();
    const metadata = ethers.keccak256(ethers.toUtf8Bytes("project"));

    await escrow.connect(client).createProject(contractor.address, metadata, [10_000n]);

    await expect(
      escrow.connect(client).fundProject(1n, 79n * FXRP),
    ).to.be.revertedWithCustomError(escrow, "SlippageExceeded");
  });

  it("funds through an EIP-712 authorization without the client sending the funding transaction", async function () {
    const { client, contractor, outsider, token, forwarder, escrow } = await fixture();
    const metadata = ethers.keccak256(ethers.toUtf8Bytes("relayed-project"));
    await escrow.connect(client).createProject(contractor.address, metadata, [10_000n]);

    const network = await ethers.provider.getNetwork();
    const latestBlock = await ethers.provider.getBlock("latest");
    const deadline = BigInt((latestBlock?.timestamp ?? 0) + 3_600);
    const maximumFxrpAmount = 81n * FXRP;

    const domain = {
      name: "MilestoneXFundingForwarder",
      version: "1",
      chainId: network.chainId,
      verifyingContract: await forwarder.getAddress(),
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
    const value = {
      escrow: await escrow.getAddress(),
      client: client.address,
      projectId: 1n,
      maximumFxrpAmount,
      nonce: 0n,
      deadline,
    };
    const signature = await client.signTypedData(domain, types, value);

    await expect(
      forwarder
        .connect(outsider)
        .executeFunding(
          value.escrow,
          value.client,
          value.projectId,
          value.maximumFxrpAmount,
          value.deadline,
          signature,
        ),
    )
      .to.emit(forwarder, "ProjectFundingRelayed")
      .withArgs(value.escrow, client.address, 1n, 80n * FXRP, 0n, outsider.address);

    expect(await token.balanceOf(await escrow.getAddress())).to.equal(80n * FXRP);
    expect(await forwarder.nonces(client.address)).to.equal(1n);

    await expect(
      forwarder
        .connect(outsider)
        .executeFunding(
          value.escrow,
          value.client,
          value.projectId,
          value.maximumFxrpAmount,
          value.deadline,
          signature,
        ),
    ).to.be.revertedWithCustomError(forwarder, "InvalidSigner");
  });

  it("requires sequential evidence and client-authorized release", async function () {
    const { client, contractor, outsider, escrow } = await fixture();
    const metadata = ethers.keccak256(ethers.toUtf8Bytes("project"));

    await escrow.connect(client).createProject(contractor.address, metadata, [5_000n, 5_000n]);
    await escrow.connect(client).fundProject(1n, 81n * FXRP);

    const evidence = ethers.keccak256(ethers.toUtf8Bytes("evidence"));
    await expect(
      escrow.connect(contractor).submitEvidence(1n, 1n, evidence),
    ).to.be.revertedWithCustomError(escrow, "InvalidMilestoneOrder");

    await escrow.connect(contractor).submitEvidence(1n, 0n, evidence);
    await expect(
      escrow.connect(outsider).releaseMilestone(1n, 0n),
    ).to.be.revertedWithCustomError(escrow, "Unauthorized");
  });

  it("refunds unreleased funds only after both parties approve cancellation", async function () {
    const { client, contractor, token, escrow } = await fixture();
    const metadata = ethers.keccak256(ethers.toUtf8Bytes("project"));

    await escrow.connect(client).createProject(contractor.address, metadata, [10_000n]);
    await escrow.connect(client).fundProject(1n, 81n * FXRP);
    const before = await token.balanceOf(client.address);

    await escrow.connect(client).approveCancellation(1n);
    expect(await token.balanceOf(await escrow.getAddress())).to.equal(80n * FXRP);

    await expect(escrow.connect(contractor).approveCancellation(1n))
      .to.emit(escrow, "ProjectCancelled")
      .withArgs(1n, 80n * FXRP);

    expect(await token.balanceOf(client.address)).to.equal(before + 80n * FXRP);
    expect((await escrow.getProject(1n)).status).to.equal(4n); // Cancelled
  });
});
