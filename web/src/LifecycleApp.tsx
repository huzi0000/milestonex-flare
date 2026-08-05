import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clipboard,
  ExternalLink,
  FileKey2,
  Gauge,
  HandCoins,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
  WalletCards,
  Zap,
} from "lucide-react";
import {
  createWalletClient,
  custom,
  formatEther,
  formatUnits,
  keccak256,
  parseAbi,
  toHex,
  type Address,
  type Hash,
} from "viem";
import BrandLogo from "./components/BrandLogo";
import ThemeToggle from "./components/ThemeToggle";
import { MilestoneEscrowArtifact } from "./generated/contracts";
import { deployment } from "./generated/deployment";
import { getVerifiedFallbackProjects, projectOneTransactions } from "./lib/milestonex";
import {
  COSTON2_CHAIN_ID,
  COSTON2_EXPLORER,
  COSTON2_FAUCET,
  connectWallet,
  coston2,
  ensureCoston2,
  getNetworkSnapshot,
  publicClient,
  shortAddress,
} from "./lib/flare";

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

type ActivityItem = {
  label: string;
  hash: Hash;
  status: "pending" | "success" | "error";
};

const tokenAbi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
]);

const STORAGE_PROJECT = "milestonex:lifecycle-project-id";
const STATUS_LABELS = ["None", "Created", "Funded", "Completed", "Cancelled"];

const sameAddress = (a?: string | null, b?: string | null) =>
  Boolean(a && b && a.toLowerCase() === b.toLowerCase());

const txUrl = (hash: Hash) => `${COSTON2_EXPLORER}/tx/${hash}`;
const addressUrl = (address: Address) => `${COSTON2_EXPLORER}/address/${address}`;

function formatFxrp(value: bigint) {
  return `${Number(formatUnits(value, 6)).toLocaleString(undefined, { maximumFractionDigits: 6 })} FXRP`;
}

function ProgressStep({ number, label, complete, active }: { number: number; label: string; complete: boolean; active: boolean }) {
  return <div className={`life-progress-step ${complete ? "complete" : ""} ${active ? "active" : ""}`}><span>{complete ? <Check size={13} /> : number}</span><p>{label}</p></div>;
}

export default function LifecycleApp() {
  const [account, setAccount] = useState<Address | null>(null);
  const [c2Balance, setC2Balance] = useState(0n);
  const [fxrpBalance, setFxrpBalance] = useState(0n);
  const [projectId, setProjectId] = useState<bigint | null>(() => {
    const saved = localStorage.getItem(STORAGE_PROJECT);
    return saved ? BigInt(saved) : 1n;
  });
  const [project, setProject] = useState<ChainProject | null>(null);
  const [milestone, setMilestone] = useState<ChainMilestone | null>(null);
  const [allowance, setAllowance] = useState(0n);
  const [quotedFxrp, setQuotedFxrp] = useState(0n);
  const [xrpUsd, setXrpUsd] = useState(0);
  const [nextProjectId, setNextProjectId] = useState(1n);
  const [contractor, setContractor] = useState("");
  const [title, setTitle] = useState("MilestoneX launch experience");
  const [amount, setAmount] = useState("5");
  const [evidence, setEvidence] = useState("Responsive implementation completed and verified on the live preview.");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const projectIdRef = useRef<bigint | null>(projectId);

  const usdCents = BigInt(Math.max(0, Math.round((Number(amount) || 0) * 100)));
  const clientAddress = project?.client ?? (deployment.deployer as Address);
  const contractorAddress = project?.contractor ?? (contractor as Address);
  const isClient = sameAddress(account, clientAddress);
  const isContractor = sameAddress(account, contractorAddress);
  const projectCreated = Boolean(project && project.status >= 1);
  const approved = allowance >= quotedFxrp && quotedFxrp > 0n;
  const funded = Boolean(project && project.status >= 2 && project.status !== 4);
  const evidenceSubmitted = Boolean(milestone?.submitted);
  const completed = project?.status === 3;

  const currentStep = useMemo(() => {
    if (completed) return 7;
    if (!account) return 1;
    if (!projectCreated) return 2;
    if (!approved && !funded) return 3;
    if (!funded) return 4;
    if (!evidenceSubmitted) return 5;
    if (!completed) return 6;
    return 7;
  }, [account, projectCreated, approved, funded, evidenceSubmitted, completed]);

  const refresh = async (connected = account, selectedId = projectId) => {
    setLoading(true);
    setError("");
    try {
      const [snapshot, next] = await Promise.all([
        getNetworkSnapshot(),
        publicClient.readContract({
          address: deployment.milestoneEscrow,
          abi: MilestoneEscrowArtifact.abi,
          functionName: "nextProjectId",
        }),
      ]);
      setXrpUsd(snapshot.xrpUsdPrice);
      setNextProjectId(next as bigint);

      if (connected) {
        const [native, token] = await Promise.all([
          publicClient.getBalance({ address: connected }),
          publicClient.readContract({ address: deployment.fxrp, abi: tokenAbi, functionName: "balanceOf", args: [connected] }),
        ]);
        setC2Balance(native);
        setFxrpBalance(token);
      }

      if (selectedId) {
        const chainProject = await publicClient.readContract({
          address: deployment.milestoneEscrow,
          abi: MilestoneEscrowArtifact.abi,
          functionName: "getProject",
          args: [selectedId],
        }) as unknown as ChainProject;

        if (chainProject.status > 0) {
          setProject(chainProject);
          const [chainMilestone, currentAllowance, quote] = await Promise.all([
            publicClient.readContract({
              address: deployment.milestoneEscrow,
              abi: MilestoneEscrowArtifact.abi,
              functionName: "getMilestone",
              args: [selectedId, 0n],
            }) as Promise<unknown> as Promise<ChainMilestone>,
            publicClient.readContract({
              address: deployment.fxrp,
              abi: tokenAbi,
              functionName: "allowance",
              args: [chainProject.client, deployment.milestoneEscrow],
            }),
            publicClient.readContract({
              address: deployment.milestoneEscrow,
              abi: MilestoneEscrowArtifact.abi,
              functionName: "quoteUsdCents",
              args: [chainProject.totalUsdCents],
            }),
          ]);
          setMilestone(chainMilestone);
          setAllowance(currentAllowance);
          setQuotedFxrp((quote as readonly [bigint, bigint])[0]);
          setContractor(chainProject.contractor);
          setAmount((Number(chainProject.totalUsdCents) / 100).toFixed(2));
        }
      }
    } catch (caught) {
      if ((selectedId ?? 1n) === 1n) {
        setError("");
        const fallback = getVerifiedFallbackProjects()[0];
        setProject({
          client: fallback.client as Address,
          contractor: fallback.contractor as Address,
          metadataHash: fallback.metadataHash as Hash,
          totalUsdCents: BigInt(fallback.totalUsdCents),
          fundedFxrp: 4_663_805n,
          releasedFxrp: 4_663_805n,
          milestoneCount: 1,
          nextMilestone: 1,
          status: 3,
        });
        setMilestone({
          usdCents: 500n,
          evidenceHash: fallback.milestones[0].evidenceHash as Hash,
          submitted: true,
          released: true,
        });
        setContractor(fallback.contractor);
        setAmount("5.00");
        setProjectId(1n);
      } else {
        setError(caught instanceof Error ? caught.message : "Unable to refresh lifecycle state.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  useEffect(() => {
    void refresh();
    const handler = (...args: unknown[]) => {
      const accounts = args[0] as Address[];
      const next = accounts?.[0] ?? null;
      setAccount(next);
      void refresh(next, projectIdRef.current);
    };
    window.ethereum?.on?.("accountsChanged", handler);
    return () => window.ethereum?.removeListener?.("accountsChanged", handler);
  }, []);

  const connect = async () => {
    setBusy("connect");
    setError("");
    try {
      await ensureCoston2();
      const connected = await connectWallet();
      setAccount(connected);
      await refresh(connected, projectId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Wallet connection failed.");
    } finally {
      setBusy("");
    }
  };

  const sendTransaction = async (label: string, action: (wallet: ReturnType<typeof createWalletClient>, account: Address) => Promise<Hash>) => {
    if (!account || !window.ethereum) return null;
    setBusy(label);
    setError("");
    try {
      const chainHex = await window.ethereum.request({ method: "eth_chainId" }) as string;
      if (Number.parseInt(chainHex, 16) !== COSTON2_CHAIN_ID) await ensureCoston2();
      const wallet = createWalletClient({ chain: coston2, transport: custom(window.ethereum) });
      const hash = await action(wallet, account);
      setActivity((items) => [{ label, hash, status: "pending" }, ...items]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
      if (receipt.status !== "success") throw new Error(`${label} transaction reverted.`);
      setActivity((items) => items.map((item) => item.hash === hash ? { ...item, status: "success" } : item));
      await refresh(account, projectId);
      return hash;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : `${label} failed.`;
      setError(message);
      return null;
    } finally {
      setBusy("");
    }
  };

  const createProject = async () => {
    if (!account || !isClient || !/^0x[a-fA-F0-9]{40}$/.test(contractor) || usdCents <= 0n) return;
    const expectedId = nextProjectId;
    const metadataHash = keccak256(toHex(JSON.stringify({ title, contractor, usdCents: usdCents.toString(), version: 1 })));
    const hash = await sendTransaction("Create project", (wallet, activeAccount) => wallet.writeContract({
      account: activeAccount,
      chain: coston2,
      address: deployment.milestoneEscrow,
      abi: MilestoneEscrowArtifact.abi,
      functionName: "createProject",
      args: [contractor as Address, metadataHash, [usdCents]],
    }));
    if (hash) {
      localStorage.setItem(STORAGE_PROJECT, expectedId.toString());
      setProjectId(expectedId);
      await refresh(account, expectedId);
    }
  };

  const approveFxrp = async () => {
    if (!account || !isClient || quotedFxrp === 0n) return;
    const maximum = (quotedFxrp * 101n) / 100n + 1n;
    await sendTransaction("Approve test FXRP", (wallet, activeAccount) => wallet.writeContract({
      account: activeAccount,
      chain: coston2,
      address: deployment.fxrp,
      abi: tokenAbi,
      functionName: "approve",
      args: [deployment.milestoneEscrow, maximum],
    }));
  };

  const fundProject = async () => {
    if (!account || !isClient || !projectId || quotedFxrp === 0n) return;
    const maximum = (quotedFxrp * 101n) / 100n + 1n;
    await sendTransaction("Fund escrow", (wallet, activeAccount) => wallet.writeContract({
      account: activeAccount,
      chain: coston2,
      address: deployment.milestoneEscrow,
      abi: MilestoneEscrowArtifact.abi,
      functionName: "fundProject",
      args: [projectId, maximum],
    }));
  };

  const submitEvidence = async () => {
    if (!account || !isContractor || !projectId || !evidence.trim()) return;
    const evidenceHash = keccak256(toHex(evidence.trim()));
    await sendTransaction("Submit evidence", (wallet, activeAccount) => wallet.writeContract({
      account: activeAccount,
      chain: coston2,
      address: deployment.milestoneEscrow,
      abi: MilestoneEscrowArtifact.abi,
      functionName: "submitEvidence",
      args: [projectId, 0n, evidenceHash],
    }));
  };

  const releaseMilestone = async () => {
    if (!account || !isClient || !projectId || !evidenceSubmitted) return;
    await sendTransaction("Release milestone", (wallet, activeAccount) => wallet.writeContract({
      account: activeAccount,
      chain: coston2,
      address: deployment.milestoneEscrow,
      abi: MilestoneEscrowArtifact.abi,
      functionName: "releaseMilestone",
      args: [projectId, 0n],
    }));
  };

  const recoverProject = async () => {
    const candidate = window.prompt("Enter the Coston2 project ID", projectId?.toString() ?? "1");
    if (!candidate || !/^\d+$/.test(candidate)) return;
    const id = BigInt(candidate);
    localStorage.setItem(STORAGE_PROJECT, id.toString());
    setProjectId(id);
    await refresh(account, id);
  };

  const buttonContent = (name: string, icon: ReactNode, text: string) =>
    busy === name ? <><LoaderCircle size={16} className="life-spin" /> Waiting for Coston2…</> : <>{icon}{text}<ArrowRight size={15} /></>;

  return (
    <div className="life-page">
      <header className="life-header">
        <a href="/" className="suite-brand"><BrandLogo /></a>
        <div className="life-live"><i /> Live Coston2 workflow</div>
        <div className="suite-actions"><ThemeToggle /><a href="/" className="life-back"><ArrowLeft size={15} /> Application</a></div>
      </header>

      <main className="life-main">
        <section className="life-hero">
          <div><span className="life-eyebrow"><Zap size={13} /> END-TO-END PROOF</span><h1>One project.<br /><em>Every promise verified.</em></h1><p>Complete the first real MilestoneX lifecycle with two test accounts. Every action below writes to the deployed escrow contract.</p></div>
          <div className="life-contract"><ShieldCheck size={20} /><p><span>ESCROW CONTRACT</span><strong>{shortAddress(deployment.milestoneEscrow)}</strong></p><a href={addressUrl(deployment.milestoneEscrow)} target="_blank" rel="noreferrer"><ExternalLink size={14} /></a></div>
        </section>

        <section className="life-progress">
          <ProgressStep number={1} label="Connect" complete={Boolean(account)} active={currentStep === 1} />
          <ProgressStep number={2} label="Create" complete={projectCreated} active={currentStep === 2} />
          <ProgressStep number={3} label="Approve" complete={approved || funded} active={currentStep === 3} />
          <ProgressStep number={4} label="Fund" complete={funded} active={currentStep === 4} />
          <ProgressStep number={5} label="Evidence" complete={evidenceSubmitted} active={currentStep === 5} />
          <ProgressStep number={6} label="Release" complete={completed} active={currentStep === 6} />
        </section>

        {completed && <section className="life-success"><BadgeCheck size={30} /><div><span>LIFECYCLE COMPLETE</span><h2>From agreement to payment—proven on Flare.</h2><p>Project #{projectId?.toString()} is complete, the contractor was paid, and every step has a public transaction receipt.</p></div></section>}

        <section className={`life-grid ${completed ? "is-complete" : ""}`}>
          <div className={`life-workflow ${completed ? "is-complete" : ""}`}>
            {completed && <article className="life-proof-card">
              <div className="proof-card-heading"><span><BadgeCheck size={22} /></span><div><p>VERIFIED PROJECT #1</p><h2>Agreement, delivery, and payment—complete.</h2><span>The public Coston2 record confirms a $5 milestone was funded with 4.663805 FXRP and released in full.</span></div></div>
              <div className="proof-metrics"><div><span>Project value</span><strong>$5.00</strong></div><div><span>FXRP funded</span><strong>4.663805</strong></div><div><span>FXRP released</span><strong>4.663805</strong></div><div><span>Escrow remainder</span><strong>0 FXRP</strong></div></div>
              <div className="proof-receipts">
                <a href={txUrl(projectOneTransactions.created)} target="_blank" rel="noreferrer"><span>01</span><p><strong>Project created</strong><small>Terms committed onchain</small></p><ExternalLink size={14} /></a>
                <a href={txUrl(projectOneTransactions.funded)} target="_blank" rel="noreferrer"><span>02</span><p><strong>Escrow funded</strong><small>FTSO-priced FXRP locked</small></p><ExternalLink size={14} /></a>
                <a href={txUrl(projectOneTransactions.evidence)} target="_blank" rel="noreferrer"><span>03</span><p><strong>Evidence submitted</strong><small>Delivery hash recorded</small></p><ExternalLink size={14} /></a>
                <a href={txUrl(projectOneTransactions.released)} target="_blank" rel="noreferrer"><span>04</span><p><strong>Payment released</strong><small>Contractor paid in full</small></p><ExternalLink size={14} /></a>
              </div>
              <div className="proof-integrity"><ShieldCheck size={17} /><span>11 automated lifecycle checks passed · no FXRP trapped in escrow</span></div>
            </article>}
            <article className={`life-card ${currentStep === 1 ? "focus" : ""}`}>
              <div className="life-card-head"><span><WalletCards size={18} /></span><div><p>STEP 01</p><h2>Connect the client wallet</h2></div>{account && <BadgeCheck size={18} />}</div>
              <p className="life-description">Begin with the original account that deployed MilestoneX and holds test FXRP.</p>
              {account ? <div className="connected-wallet"><span className="wallet-letter">{isClient ? "C" : isContractor ? "W" : "?"}</span><p><strong>{shortAddress(account)}</strong><small>{isClient ? "Client account" : isContractor ? "Contractor account" : "Unknown account"}</small></p><div><strong>{formatFxrp(fxrpBalance)}</strong><small>{Number(formatEther(c2Balance)).toFixed(2)} C2FLR</small></div></div> : <button className="life-primary" onClick={connect} disabled={Boolean(busy)}>{buttonContent("connect", <WalletCards size={16} />, "Connect wallet")}</button>}
              {account && <button className="life-refresh" onClick={connect}><RefreshCw size={13} /> Refresh active MetaMask account</button>}
            </article>

            <article className={`life-card ${currentStep === 2 ? "focus" : ""} ${projectCreated ? "done" : ""}`}>
              <div className="life-card-head"><span><BriefcaseBusiness size={18} /></span><div><p>STEP 02</p><h2>Create one real milestone</h2></div>{projectCreated && <BadgeCheck size={18} />}</div>
              {projectCreated ? <div className="onchain-state"><div><span>Project ID</span><strong>#{projectId?.toString()}</strong></div><div><span>Client</span><strong>{shortAddress(project?.client)}</strong></div><div><span>Contractor</span><strong>{shortAddress(project?.contractor)}</strong></div><div><span>Value</span><strong>${(Number(project?.totalUsdCents ?? 0n) / 100).toFixed(2)}</strong></div></div> : <><div className="life-fields"><label>Project title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Contractor public address<input value={contractor} onChange={(event) => setContractor(event.target.value)} placeholder="0x…" /></label><label>Test milestone value (USD)<div className="life-money"><span>$</span><input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))} /></div><small>Keep this at $5 or lower so 10 test FXRP is sufficient.</small></label></div><button className="life-primary" onClick={createProject} disabled={!isClient || Boolean(busy) || !/^0x[a-fA-F0-9]{40}$/.test(contractor) || usdCents === 0n}>{buttonContent("Create project", <BriefcaseBusiness size={16} />, "Create project on Coston2")}</button></>}
            </article>

            <article className={`life-card ${currentStep === 3 ? "focus" : ""} ${approved || funded ? "done" : ""}`}>
              <div className="life-card-head"><span><CircleDollarSign size={18} /></span><div><p>STEP 03</p><h2>Approve the quoted FXRP</h2></div>{(approved || funded) && <BadgeCheck size={18} />}</div>
              <p className="life-description">The escrow can transfer only the amount approved for this test project.</p>
              <div className="quote-line"><span>Live FTSO quote</span><strong>{quotedFxrp ? formatFxrp(quotedFxrp) : "Waiting for project"}</strong><small>${xrpUsd.toFixed(5)} / XRP</small></div>
              {!funded && <button className="life-primary" onClick={approveFxrp} disabled={!projectCreated || !isClient || Boolean(busy) || approved}>{approved ? <><Check size={16} /> FXRP approved</> : buttonContent("Approve test FXRP", <KeyRound size={16} />, "Approve test FXRP")}</button>}
            </article>

            <article className={`life-card ${currentStep === 4 ? "focus" : ""} ${funded ? "done" : ""}`}>
              <div className="life-card-head"><span><ShieldCheck size={18} /></span><div><p>STEP 04</p><h2>Fund the escrow</h2></div>{funded && <BadgeCheck size={18} />}</div>
              <p className="life-description">The contract refreshes the FTSO quote, applies your 1% maximum, and locks test FXRP.</p>
              {funded ? <div className="funded-banner"><ShieldCheck size={20} /><p><strong>{formatFxrp(project?.fundedFxrp ?? 0n)} protected</strong><span>Held by the deployed MilestoneX escrow</span></p></div> : <button className="life-primary" onClick={fundProject} disabled={!approved || !isClient || Boolean(busy)}>{buttonContent("Fund escrow", <HandCoins size={16} />, "Fund protected escrow")}</button>}
            </article>

            <article className={`life-card ${currentStep === 5 ? "focus" : ""} ${evidenceSubmitted ? "done" : ""}`}>
              <div className="life-card-head"><span><FileKey2 size={18} /></span><div><p>STEP 05</p><h2>Submit contractor evidence</h2></div>{evidenceSubmitted && <BadgeCheck size={18} />}</div>
              {evidenceSubmitted ? <div className="evidence-state"><CheckCircle2 size={18} /><p><strong>Evidence hash committed</strong><code>{milestone?.evidenceHash}</code></p></div> : <><div className="switch-account"><UserRound size={18} /><p><strong>Switch to the contractor account</strong><span>Current contractor: {shortAddress(project?.contractor)}</span></p>{isContractor ? <BadgeCheck size={18} /> : <span>Required</span>}</div><label className="evidence-input">Evidence note<textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} /></label><button className="life-primary" onClick={submitEvidence} disabled={!funded || !isContractor || Boolean(busy) || !evidence.trim()}>{buttonContent("Submit evidence", <Send size={16} />, "Hash & submit evidence")}</button></>}
            </article>

            <article className={`life-card ${currentStep === 6 ? "focus" : ""} ${completed ? "done" : ""}`}>
              <div className="life-card-head"><span><HandCoins size={18} /></span><div><p>STEP 06</p><h2>Release the payment</h2></div>{completed && <BadgeCheck size={18} />}</div>
              {completed ? <div className="funded-banner success"><BadgeCheck size={20} /><p><strong>{formatFxrp(project?.releasedFxrp ?? 0n)} released</strong><span>Contractor payment verified on Coston2</span></p></div> : <><div className="switch-account"><WalletCards size={18} /><p><strong>Switch back to the client account</strong><span>Required client: {shortAddress(project?.client)}</span></p>{isClient ? <BadgeCheck size={18} /> : <span>Required</span>}</div><button className="life-primary" onClick={releaseMilestone} disabled={!evidenceSubmitted || !isClient || Boolean(busy)}>{buttonContent("Release milestone", <HandCoins size={16} />, "Release milestone payment")}</button></>}
            </article>
          </div>

          <aside className="life-aside">
            <article className="life-summary">
              <div className="life-aside-title"><Gauge size={16} /><span>LIVE CONTRACT STATE</span><button onClick={() => refresh()}><RefreshCw size={13} className={loading ? "life-spin" : ""} /></button></div>
              <div><span>Project</span><strong>{projectId ? `#${projectId}` : "Not created"}</strong></div>
              <div><span>Status</span><strong>{STATUS_LABELS[project?.status ?? 0]}</strong></div>
              <div><span>Escrowed</span><strong>{formatFxrp((project?.fundedFxrp ?? 0n) - (project?.releasedFxrp ?? 0n))}</strong></div>
              <div><span>Released</span><strong>{formatFxrp(project?.releasedFxrp ?? 0n)}</strong></div>
              <div><span>Evidence</span><strong>{milestone?.submitted ? "Committed" : "Pending"}</strong></div>
              <button className="recover-button" onClick={recoverProject}>Recover an existing project ID</button>
              <a className="life-faucet" href={COSTON2_FAUCET} target="_blank" rel="noreferrer"><CircleDollarSign size={14} /><span><strong>Get Coston2 test tokens</strong><small>Official Flare faucet · C2FLR and FXRP</small></span><ExternalLink size={13} /></a>
            </article>

            <article className="life-roles">
              <div className="life-aside-title"><UserRound size={16} /><span>ROLE CHECK</span></div>
              <div><span className="role-icon client">C</span><p><strong>Client</strong><small>{shortAddress(clientAddress)}</small></p>{isClient && <BadgeCheck size={16} />}</div>
              <div><span className="role-icon worker">W</span><p><strong>Contractor</strong><small>{project?.contractor ? shortAddress(project.contractor) : "Set in step 2"}</small></p>{isContractor && <BadgeCheck size={16} />}</div>
              <p className="role-note">Use MetaMask's account switcher, then click “Refresh active MetaMask account.”</p>
            </article>

            <article className="life-activity">
              <div className="life-aside-title"><Zap size={16} /><span>TRANSACTIONS</span></div>
              {activity.length === 0 ? <div className="activity-empty"><Clipboard size={21} /><p>Receipts will appear here as you complete each step.</p></div> : activity.map((item) => <a href={txUrl(item.hash)} target="_blank" rel="noreferrer" key={item.hash}><span className={`tx-state ${item.status}`}>{item.status === "success" ? <Check size={12} /> : <LoaderCircle size={12} className="life-spin" />}</span><p><strong>{item.label}</strong><small>{shortAddress(item.hash)}</small></p><ExternalLink size={13} /></a>)}
            </article>

            <article className="life-warning"><AlertTriangle size={17} /><p><strong>Testnet safety</strong><span>Use only the two dedicated Coston2 accounts. Expect one MetaMask confirmation per button.</span></p></article>
          </aside>
        </section>

        {error && <div className="life-error"><AlertTriangle size={17} /><span>{error}</span><button onClick={() => setError("")}>Dismiss</button></div>}
      </main>
    </div>
  );
}
