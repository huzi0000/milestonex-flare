import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Blocks,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  FileCheck2,
  FileKey2,
  Gauge,
  HandCoins,
  Home,
  Info,
  Layers3,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Milestone as MilestoneIcon,
  MoreHorizontal,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Unplug,
  Users,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import {
  COSTON2_EXPLORER,
  connectWallet,
  ensureCoston2,
  getFxrpBalance,
  getNetworkSnapshot,
  shortAddress,
  type NetworkSnapshot,
} from "./lib/flare";
import { demoProjects, fxrp, money, type Project } from "./lib/data";
import { getLiveProjects } from "./lib/milestonex";
import { deployment } from "./generated/deployment";
import BrandLogo from "./components/BrandLogo";
import ThemeToggle from "./components/ThemeToggle";

type View = "dashboard" | "project" | "create" | "activity" | "settings";
type MilestoneDraft = { title: string; amount: string };

const statusLabel: Record<string, string> = {
  funded: "Funds protected",
  created: "Awaiting funding",
  completed: "Completed",
  cancelled: "Cancelled",
  paid: "Paid",
  submitted: "Ready for review",
  active: "In progress",
  upcoming: "Upcoming",
};

const copyText = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Clipboard may be unavailable in an embedded preview.
  }
};

function StatusPill({ status }: { status: string }) {
  return <span className={`status status-${status}`}><span />{statusLabel[status] ?? status}</span>;
}

function EmptyAddress({ value }: { value: string }) {
  return (
    <button className="address-chip" onClick={() => copyText(value)} title="Copy address">
      <span>{shortAddress(value)}</span><Copy size={13} />
    </button>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = "mint",
  loading = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  accent?: "mint" | "amber" | "blue" | "violet";
  loading?: boolean;
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-${accent}`}><Icon size={19} /></div>
      <p>{label}</p>
      {loading ? <div className="skeleton stat-skeleton" /> : <h3>{value}</h3>}
      <span>{detail}</span>
    </article>
  );
}

function NetworkCard({
  snapshot,
  loading,
  onRefresh,
}: {
  snapshot: NetworkSnapshot | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <article className="network-card">
      <div className="network-topline">
        <div>
          <span className="eyebrow"><span className="pulse-dot" />LIVE NETWORK</span>
          <h3>Proof, not promises.</h3>
        </div>
        <button className="icon-button small" onClick={onRefresh} disabled={loading} aria-label="Refresh network data">
          <RefreshCw size={15} className={loading ? "spinning" : ""} />
        </button>
      </div>
      <p className="network-copy">Every quote, deposit, and release is anchored to Flare’s public Coston2 testnet.</p>
      <div className="network-metrics">
        <div><span>XRP / USD</span><strong>{snapshot ? `$${snapshot.xrpUsdPrice.toFixed(4)}` : "—"}</strong></div>
        <div><span>Latest block</span><strong>{snapshot ? `#${snapshot.blockNumber.toLocaleString()}` : "—"}</strong></div>
      </div>
      <div className="network-stack">
        <div><span className="stack-icon"><CircleDollarSign size={16} /></span><p><strong>FXRP</strong><small>Programmable XRP</small></p><BadgeCheck size={17} /></div>
        <div><span className="stack-icon"><Gauge size={16} /></span><p><strong>FTSOv2</strong><small>Decentralized pricing</small></p><BadgeCheck size={17} /></div>
        <div><span className="stack-icon"><Blocks size={16} /></span><p><strong>Coston2</strong><small>Public testnet proof</small></p><BadgeCheck size={17} /></div>
      </div>
      <a className="network-link" href={COSTON2_EXPLORER} target="_blank" rel="noreferrer">Open network explorer <ExternalLink size={14} /></a>
    </article>
  );
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const paid = project.milestones.filter((item) => item.status === "paid").length;
  const submitted = project.milestones.filter((item) => item.status === "submitted").length;
  const progress = project.status === "completed" ? 100 : Math.round((paid / project.milestones.length) * 100);

  return (
    <button className="project-card" onClick={onOpen}>
      <div className="project-card-top">
        <div className="project-symbol"><BriefcaseBusiness size={20} /></div>
        {project.source === "live" && <span className="live-source"><span /> LIVE ON COSTON2</span>}
        {project.source === "demo" && <span className="demo-source">UI PREVIEW</span>}
        <StatusPill status={project.status} />
        <MoreHorizontal className="project-more" size={19} />
      </div>
      <div className="project-copy">
        <span>{project.category}</span>
        <h3>{project.title}</h3>
      </div>
      <div className="project-money">
        <div><span>Project value</span><strong>{money(project.totalUsdCents)}</strong></div>
        <div className="align-right"><span>Protected</span><strong>{fxrp(project.lockedFxrp - project.releasedFxrp)}</strong></div>
      </div>
      <div className="progress-line"><span style={{ width: `${progress}%` }} /></div>
      <div className="project-footer">
        <span>{paid}/{project.milestones.length} milestones paid{submitted ? ` · ${submitted} ready` : ""}</span>
        <span>{project.source === "live" ? project.due : `Due ${project.due}`}<ArrowRight size={14} /></span>
      </div>
    </button>
  );
}

function ProductFlow() {
  const steps = [
    { icon: FileCheck2, number: "01", title: "Agree", copy: "Set USD-denominated outcomes and a contractor wallet." },
    { icon: ShieldCheck, number: "02", title: "Lock", copy: "FTSO prices the project and FXRP moves into escrow." },
    { icon: FileKey2, number: "03", title: "Prove", copy: "The contractor commits a tamper-evident delivery hash." },
    { icon: HandCoins, number: "04", title: "Release", copy: "Approved FXRP settles directly with a public receipt." },
  ];
  return (
    <section className="how-v4">
      <div className="how-head-v4">
        <div><span>HOW MILESTONEX WORKS</span><h3>From scope to settlement,<br /><em>without the trust gap.</em></h3></div>
        <p>Flare turns XRP into programmable project value. MilestoneX adds the workflow that clients and contractors actually need.</p>
      </div>
      <div className="how-rail-v4">
        <div className="how-line-v4"><i /><b /></div>
        {steps.map(({ icon: Icon, number, title, copy }) => (
          <article key={number}>
            <div className="how-node-v4"><Icon size={20} /><span>{number}</span></div>
            <h4>{title}</h4>
            <p>{copy}</p>
          </article>
        ))}
        <span className="moving-fxrp-v4">XRP</span>
      </div>
      <div className="flare-stack-v4">
        <div><span className="stack-visual-v4"><CircleDollarSign size={20} /></span><p><strong>FXRP</strong><span>Programmable XRP value</span></p></div>
        <ArrowRight size={16} />
        <div><span className="stack-visual-v4"><Gauge size={20} /></span><p><strong>FTSOv2</strong><span>Decentralized USD pricing</span></p></div>
        <ArrowRight size={16} />
        <div><span className="stack-visual-v4"><Blocks size={20} /></span><p><strong>Coston2</strong><span>Public execution proof</span></p></div>
      </div>
    </section>
  );
}

function Dashboard({
  projects,
  snapshot,
  loadingNetwork,
  onRefreshNetwork,
  onOpenProject,
  onCreate,
  liveLoading,
}: {
  projects: Project[];
  snapshot: NetworkSnapshot | null;
  loadingNetwork: boolean;
  liveLoading: boolean;
  onRefreshNetwork: () => void;
  onOpenProject: (project: Project) => void;
  onCreate: () => void;
}) {
  const liveProjects = projects.filter((project) => project.source === "live");
  const active = liveProjects.filter((project) => project.status === "funded");
  const protectedFxrp = liveProjects.reduce((sum, project) => sum + Math.max(0, project.lockedFxrp - project.releasedFxrp), 0);
  const released = liveProjects.reduce((sum, project) => sum + project.releasedFxrp, 0);
  const completedCount = liveProjects.filter((project) => project.status === "completed").length;

  return (
    <>
      <section className="dashboard-hero-v4">
        <div className="hero-copy-v4">
          <div className="flare-kicker"><span className="flare-kicker-icon"><Blocks size={15} /></span><span>INTEROPERABLE ASSETS ON FLARE</span></div>
          <h1>Work protected.<br /><em>Payments proven.</em></h1>
          <p>Programmable FXRP escrow for global work. Agree in milestones, verify each delivery, and release value with public Coston2 proof.</p>
          <div className="hero-actions"><a className="primary-button" href="/lifecycle.html"><Zap size={17} /> Explore verified lifecycle</a><button className="secondary-button" onClick={onCreate}><Plus size={17} /> Create a project</button></div>
          <div className="hero-trust-v4">
            <span><BadgeCheck size={15} /> Deployed contracts</span>
            <span><Gauge size={15} /> Live FTSOv2 pricing</span>
            <span><CircleDollarSign size={15} /> Real test FXRP</span>
          </div>
        </div>
        <div className="hero-visual-v4">
          <img src="/visuals/milestonex-hero.webp" alt="Abstract MilestoneX escrow vault surrounded by a path of milestone tokens" />
          <div className="visual-flare-badge"><span className="visual-flare-icon"><Blocks size={18} /></span><span><small>BUILT ON</small><strong>Flare</strong></span></div>
          <div className="visual-proof-badge"><BadgeCheck size={18} /><span><small>PROJECT #1</small><strong>Lifecycle verified</strong></span></div>
          <div className="visual-route-v4"><span className="done">1</span><i /><span className="done">2</span><i /><span className="done">3</span><i /><span className="done">4</span></div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Onchain projects" value={String(liveProjects.length)} detail={`${completedCount} completed · ${active.length} funded`} icon={ShieldCheck} loading={liveLoading} />
        <StatCard label="FXRP protected" value={fxrp(protectedFxrp)} detail="Current deployed escrow balance" icon={WalletCards} accent="blue" loading={liveLoading} />
        <StatCard label="FXRP released" value={fxrp(released)} detail="Verified contractor payments" icon={HandCoins} accent="amber" loading={liveLoading} />
        <StatCard label="Live XRP price" value={snapshot ? `$${snapshot.xrpUsdPrice.toFixed(4)}` : "—"} detail="Secured by FTSOv2" icon={Activity} accent="violet" loading={loadingNetwork && !snapshot} />
      </section>

      <section className="dashboard-grid">
        <div className="projects-panel">
          <div className="section-heading">
            <div><h2>Live on Coston2</h2><span>{liveProjects.length} verified project{liveProjects.length === 1 ? "" : "s"}</span></div>
            <a className="section-proof-link" href={`${COSTON2_EXPLORER}/address/${deployment.milestoneEscrow}`} target="_blank" rel="noreferrer">Escrow contract <ExternalLink size={12} /></a>
          </div>
          <div className="project-list">
            {liveLoading && <div className="live-loading"><LoaderCircle size={16} className="spinning" /> Reading deployed escrow…</div>}
            {!liveLoading && liveProjects.length === 0 && <div className="live-loading">No live project has been created yet.</div>}
            {liveProjects.map((project) => <ProjectCard key={`live-${project.id}`} project={project} onOpen={() => onOpenProject(project)} />)}
          </div>
        </div>
        <aside>
          <NetworkCard snapshot={snapshot} loading={loadingNetwork} onRefresh={onRefreshNetwork} />
          <article className="insight-card">
            <div className="insight-icon"><Sparkles size={18} /></div>
            <div><span>Milestone insight</span><strong>One deliverable is ready for review.</strong><p>Reviewing it today keeps the project on schedule.</p></div>
            <ArrowRight size={18} />
          </article>
        </aside>
      </section>
      <ProductFlow />
    </>
  );
}

function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
  const paidCount = project.milestones.filter((m) => m.status === "paid").length;
  const progress = project.status === "completed" ? 100 : Math.round((paidCount / project.milestones.length) * 100);
  const remaining = project.lockedFxrp - project.releasedFxrp;

  return (
    <>
      <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to projects</button>
      <section className="project-hero">
        <div className="project-hero-copy">
          <div className="title-row"><div className="project-symbol large"><BriefcaseBusiness size={24} /></div><div><span>{project.category}</span><h1>{project.title}</h1></div></div>
          <div className="hero-meta"><StatusPill status={project.status} /><span><Clock3 size={14} /> {project.source === "live" ? project.due : `Due ${project.due}`}</span><span>Project #{String(project.id).padStart(3, "0")}</span></div>
        </div>
        <div className="project-actions">
          {project.source === "live" ? <>
            <a className="secondary-button" href={project.proof?.released ? `${COSTON2_EXPLORER}/tx/${project.proof.released}` : `${COSTON2_EXPLORER}/address/${deployment.milestoneEscrow}`} target="_blank" rel="noreferrer"><ReceiptText size={16} /> Final receipt</a>
            <a className="primary-button" href="/lifecycle.html"><ShieldCheck size={16} /> Lifecycle proof</a>
          </> : <>
            <button className="secondary-button"><ReceiptText size={16} /> View preview</button>
            <button className="primary-button"><Send size={16} /> Invite contractor</button>
          </>}
        </div>
      </section>

      <section className="project-overview-grid">
        <article className="overview-card balance-card">
          <span>Protected project balance</span>
          <h2>{fxrp(remaining)}</h2>
          <p>≈ {money(Math.round((project.totalUsdCents * remaining) / project.lockedFxrp))} at the funding quote</p>
          <div className="balance-progress"><span style={{ width: `${100 - progress}%` }} /></div>
          <div className="balance-labels"><span>{fxrp(project.releasedFxrp)} released</span><span>{progress}% complete</span></div>
        </article>
        <article className="overview-card parties-card">
          <div><span>Client</span><strong>You</strong><EmptyAddress value={project.client} /></div>
          <ArrowDownRight size={18} />
          <div><span>Contractor</span><strong>Product partner</strong><EmptyAddress value={project.contractor} /></div>
        </article>
        <article className="overview-card proof-card">
          <span>Onchain protection</span>
          <div><ShieldCheck size={24} /><strong>Escrow verified</strong></div>
          <p>Funds release only through the agreed milestone sequence.</p>
          <button>Inspect contract <ExternalLink size={13} /></button>
        </article>
      </section>

      <section className="milestone-layout">
        <div className="milestone-panel">
          <div className="section-heading"><div><h2>Milestone schedule</h2><span>{project.milestones.length} deliverables</span></div><button className="secondary-button compact"><FileCheck2 size={15} /> Project terms</button></div>
          <div className="timeline">
            {project.milestones.map((milestone, index) => (
              <article className={`timeline-item timeline-${milestone.status}`} key={milestone.id}>
                <div className="timeline-rail"><span>{milestone.status === "paid" ? <Check size={15} /> : index + 1}</span><i /></div>
                <div className="timeline-content">
                  <div className="timeline-top"><div><StatusPill status={milestone.status} /><h3>{milestone.title}</h3></div><strong>{money(milestone.usdCents)}</strong></div>
                  <p>{milestone.description}</p>
                  <div className="timeline-meta"><span><Clock3 size={14} /> Due {milestone.due}</span>{milestone.evidenceHash && <button onClick={() => copyText(milestone.evidenceHash!)}><FileKey2 size={14} /> Evidence {shortAddress(milestone.evidenceHash)}<Copy size={12} /></button>}</div>
                  {milestone.status === "submitted" && <div className="review-bar"><div><CheckCircle2 size={18} /><span><strong>Evidence submitted</strong><small>Review the work before releasing this milestone.</small></span></div><button>Review & release <ArrowRight size={14} /></button></div>}
                </div>
              </article>
            ))}
          </div>
        </div>
        <aside className="audit-panel">
          <span className="eyebrow">PROJECT AUDIT</span>
          <h3>Everything important has a proof.</h3>
          <div className="audit-list">
            <div><span><FileCheck2 size={16} /></span><p><strong>Terms committed</strong><small>Metadata hash anchored</small></p><CheckCircle2 size={16} /></div>
            <div><span><CircleDollarSign size={16} /></span><p><strong>Price recorded</strong><small>FTSOv2 funding quote</small></p><CheckCircle2 size={16} /></div>
            <div><span><ShieldCheck size={16} /></span><p><strong>Funds protected</strong><small>FXRP held by escrow</small></p><CheckCircle2 size={16} /></div>
          </div>
          <div className="hash-box"><span>Metadata commitment</span><code>{project.metadataHash}</code><button onClick={() => copyText(project.metadataHash)}><Copy size={14} /> Copy hash</button></div>
        </aside>
      </section>
    </>
  );
}

function CreateProject({
  xrpPrice,
  onCancel,
  onCreated,
}: {
  xrpPrice: number;
  onCancel: () => void;
  onCreated: (project: Project) => void;
}) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [contractor, setContractor] = useState("");
  const [category, setCategory] = useState("Product development");
  const [due, setDue] = useState("2026-08-28");
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    { title: "Discovery & project direction", amount: "500" },
    { title: "Core build", amount: "900" },
    { title: "QA & handoff", amount: "400" },
  ]);

  const totalUsd = milestones.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const estimatedFxrp = xrpPrice > 0 ? totalUsd / xrpPrice : 0;
  const valid = title.trim().length > 2 && /^0x[a-fA-F0-9]{40}$/.test(contractor) && totalUsd > 0;

  const updateMilestone = (index: number, field: keyof MilestoneDraft, value: string) => {
    setMilestones((current) => current.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const create = () => {
    const newProject: Project = {
      id: Date.now(),
      title,
      category,
      client: "0x17A9b7E81D40c01296F91b7A1306AcC3819A7F3B",
      contractor,
      metadataHash: `0x${crypto.randomUUID().replace(/-/g, "").padEnd(64, "0")}`,
      totalUsdCents: Math.round(totalUsd * 100),
      lockedFxrp: estimatedFxrp,
      releasedFxrp: 0,
      status: "created",
      source: "demo",
      due: new Date(`${due}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      milestones: milestones.map((item, index) => ({
        id: index,
        title: item.title || `Milestone ${index + 1}`,
        description: "Deliverable details are committed with the project metadata.",
        usdCents: Math.round((Number(item.amount) || 0) * 100),
        due: new Date(`${due}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        status: index === 0 ? "active" : "upcoming",
      })),
    };
    onCreated(newProject);
  };

  return (
    <section className="create-shell">
      <button className="back-button" onClick={onCancel}><ArrowLeft size={16} /> Cancel project setup</button>
      <div className="create-heading"><span className="eyebrow">NEW PROTECTED PROJECT</span><h1>Turn a brief into<br /><em>clear, payable progress.</em></h1><p>Define the work once. MilestoneX converts every USD milestone into transparent FXRP funding.</p></div>
      <div className="stepper"><span className={step >= 1 ? "active" : ""}><i>{step > 1 ? <Check size={13} /> : 1}</i>Project</span><b /><span className={step >= 2 ? "active" : ""}><i>2</i>Milestones</span><b /><span className={step >= 3 ? "active" : ""}><i>3</i>Review</span></div>

      <div className="create-grid">
        <div className="form-card">
          {step === 1 && <>
            <div className="form-title"><span><BriefcaseBusiness size={18} /></span><div><h2>Project details</h2><p>Set the shared context for the client and contractor.</p></div></div>
            <label>Project title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Marketplace mobile experience" autoFocus /></label>
            <div className="field-grid"><label>Work category<select value={category} onChange={(e) => setCategory(e.target.value)}><option>Product development</option><option>Design</option><option>AI implementation</option><option>Marketing & content</option><option>Consulting</option></select><ChevronDown size={15} /></label><label>Target completion<input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></label></div>
            <label>Contractor wallet<div className="input-with-icon"><Users size={16} /><input value={contractor} onChange={(e) => setContractor(e.target.value)} placeholder="0x…" /></div><small>The contractor uses this wallet to submit evidence and receive released FXRP.</small></label>
          </>}

          {step === 2 && <>
            <div className="form-title"><span><MilestoneIcon size={18} /></span><div><h2>Payment milestones</h2><p>Break the project into independently reviewable outcomes.</p></div></div>
            <div className="milestone-builder">
              {milestones.map((item, index) => <div className="milestone-row" key={index}><span>{index + 1}</span><input value={item.title} onChange={(e) => updateMilestone(index, "title", e.target.value)} placeholder="Milestone name" /><div className="money-input"><i>$</i><input value={item.amount} inputMode="decimal" onChange={(e) => updateMilestone(index, "amount", e.target.value.replace(/[^0-9.]/g, ""))} /></div>{milestones.length > 1 && <button onClick={() => setMilestones((current) => current.filter((_, i) => i !== index))}><X size={15} /></button>}</div>)}
            </div>
            {milestones.length < 12 && <button className="add-milestone" onClick={() => setMilestones((current) => [...current, { title: "", amount: "" }])}><Plus size={15} /> Add milestone</button>}
          </>}

          {step === 3 && <>
            <div className="form-title"><span><ShieldCheck size={18} /></span><div><h2>Review protection</h2><p>Confirm the values that will become part of the project commitment.</p></div></div>
            <div className="review-project"><span>PROJECT</span><h3>{title || "Untitled project"}</h3><p>{category} · Due {new Date(`${due}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p><div><small>Contractor</small><code>{contractor || "No address"}</code></div></div>
            <div className="review-milestones">{milestones.map((item, index) => <div key={index}><span>{index + 1}</span><p><strong>{item.title || `Milestone ${index + 1}`}</strong><small>{money(Math.round((Number(item.amount) || 0) * 100))}</small></p><CheckCircle2 size={17} /></div>)}</div>
            <div className="demo-notice"><Info size={17} /><p><strong>Prototype mode</strong><span>This creates a local demo project. Live Coston2 writes activate after contract deployment.</span></p></div>
          </>}

          <div className="form-actions"><button className="secondary-button" onClick={() => step === 1 ? onCancel() : setStep(step - 1)}>{step === 1 ? "Cancel" : "Back"}</button>{step < 3 ? <button className="primary-button" onClick={() => setStep(step + 1)} disabled={step === 1 ? !title || !contractor : totalUsd <= 0}>Continue <ArrowRight size={15} /></button> : <button className="primary-button" disabled={!valid} onClick={create}><ShieldCheck size={16} /> Create protected project</button>}</div>
        </div>

        <aside className="quote-card">
          <span className="eyebrow">LIVE PROJECT QUOTE</span>
          <div className="quote-price"><span>Project value</span><strong>{money(Math.round(totalUsd * 100))}</strong></div>
          <div className="quote-conversion"><div><span>Estimated funding</span><strong>{estimatedFxrp.toLocaleString(undefined, { maximumFractionDigits: 2 })} FXRP</strong></div><span>at ${xrpPrice.toFixed(4)} / XRP</span></div>
          <div className="quote-breakdown">{milestones.map((item, index) => <div key={index}><span>{index + 1}. {item.title || "Untitled milestone"}</span><strong>${Number(item.amount || 0).toLocaleString()}</strong></div>)}</div>
          <div className="quote-trust"><Gauge size={17} /><p><strong>Priced by FTSOv2</strong><span>The final contract quote is refreshed when funding begins.</span></p></div>
        </aside>
      </div>
    </section>
  );
}

function ActivityView() {
  const items = [
    { icon: HandCoins, title: "Milestone payment released", meta: "Commerce dashboard redesign · 782.20 FXRP", time: "2h ago", tone: "mint" },
    { icon: FileKey2, title: "Evidence submitted", meta: "Interface design system · 0x7d82…b118", time: "5h ago", tone: "blue" },
    { icon: ShieldCheck, title: "Project escrow funded", meta: "Research assistant MVP · 1,676.14 FXRP", time: "Yesterday", tone: "amber" },
    { icon: BriefcaseBusiness, title: "Project terms committed", meta: "Research assistant MVP · Project #002", time: "Yesterday", tone: "violet" },
    { icon: CheckCircle2, title: "Project completed", meta: "Brand launch microsite · 884.08 FXRP released", time: "Jul 28", tone: "mint" },
  ];
  return <section className="activity-page"><div className="page-heading"><div><span className="eyebrow">AUDIT TRAIL</span><h1>Every action,<br /><em>easy to verify.</em></h1><p>A human-readable view of the events your contracts make public.</p></div></div><div className="activity-card"><div className="section-heading"><div><h2>Recent activity</h2><span>From all projects</span></div><button className="secondary-button compact"><ExternalLink size={14} /> Explorer</button></div><div className="activity-list">{items.map((item, index) => { const Icon = item.icon; return <div key={index}><span className={`activity-icon stat-${item.tone}`}><Icon size={17} /></span><p><strong>{item.title}</strong><small>{item.meta}</small></p><time>{item.time}</time><ArrowRight size={15} /></div>; })}</div></div></section>;
}

function SettingsView({ snapshot }: { snapshot: NetworkSnapshot | null }) {
  return <section className="activity-page"><div className="page-heading"><div><span className="eyebrow">WORKSPACE</span><h1>Trust settings.</h1><p>Review the public infrastructure MilestoneX currently relies on.</p></div></div><div className="settings-grid"><article className="setting-card"><span><Blocks size={19} /></span><div><h3>Flare Coston2</h3><p>Chain ID 114 · Public test network</p></div><StatusPill status="funded" /></article><article className="setting-card"><span><CircleDollarSign size={19} /></span><div><h3>Test FXRP</h3><p>{snapshot?.fxrpAddress ?? "Resolving from registry…"}</p></div><BadgeCheck size={18} /></article><article className="setting-card"><span><Gauge size={19} /></span><div><h3>FTSOv2 XRP/USD</h3><p>{snapshot ? `$${snapshot.xrpUsdPrice.toFixed(6)} · block #${snapshot.blockNumber}` : "Loading live feed…"}</p></div><BadgeCheck size={18} /></article></div></section>;
}

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [projects, setProjects] = useState<Project[]>(demoProjects);
  const [liveProjects, setLiveProjects] = useState<Project[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [selected, setSelected] = useState<Project>(demoProjects[0]);
  const [snapshot, setSnapshot] = useState<NetworkSnapshot | null>(null);
  const [networkLoading, setNetworkLoading] = useState(true);
  const [networkError, setNetworkError] = useState("");
  const [wallet, setWallet] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const refreshNetwork = async () => {
    setNetworkLoading(true);
    setNetworkError("");
    try {
      const result = await getNetworkSnapshot();
      setSnapshot(result);
      if (wallet) setWalletBalance(await getFxrpBalance(wallet as `0x${string}`, result));
    } catch (error) {
      setNetworkError(error instanceof Error ? error.message : "Coston2 data is temporarily unavailable.");
    } finally {
      setNetworkLoading(false);
    }
  };

  useEffect(() => { void refreshNetwork(); }, []);

  useEffect(() => {
    let active = true;
    setLiveLoading(true);
    getLiveProjects()
      .then((result) => {
        if (!active) return;
        setLiveProjects(result);
        if (result[0]) setSelected(result[0]);
      })
      .catch(() => {
        if (active) setLiveProjects([]);
      })
      .finally(() => {
        if (active) setLiveLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleWallet = async () => {
    setWalletBusy(true);
    setWalletError("");
    try {
      await ensureCoston2();
      const account = await connectWallet();
      setWallet(account);
      if (snapshot) setWalletBalance(await getFxrpBalance(account, snapshot));
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Wallet connection failed.");
    } finally {
      setWalletBusy(false);
    }
  };

  const openProject = (project: Project) => { setSelected(project); setView("project"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const changeView = (next: View) => { setView(next); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const visibleProjects = useMemo(
    () => [...liveProjects, ...projects],
    [liveProjects, projects],
  );
  const sidebarProjects = liveProjects.length ? liveProjects : projects;

  const navItems = useMemo(() => [
    { id: "dashboard" as View, label: "Overview", icon: LayoutDashboard },
    { id: "activity" as View, label: "Activity", icon: Activity },
    { id: "settings" as View, label: "Network", icon: Blocks },
  ], []);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="sidebar-head"><BrandLogo tone="light" /><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={20} /></button></div>
        <nav>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={view === id || (id === "dashboard" && view === "project") ? "active" : ""} onClick={() => changeView(id)}><Icon size={18} /><span>{label}</span></button>)}<span className="nav-label">PROJECTS</span>{sidebarProjects.slice(0, 3).map((project) => <button className={view === "project" && selected.id === project.id ? "active project-nav" : "project-nav"} key={`${project.source ?? "demo"}-${project.id}`} onClick={() => openProject(project)}><span className={`project-dot project-dot-${project.status}`} /><span>{project.title}</span></button>)}</nav>
        <div className="sidebar-bottom"><div className="build-card"><span><Zap size={15} /> HACKATHON BUILD</span><strong>10 days to signal</strong><p>Core contracts ready. Product experience in progress.</p><div><i style={{ width: "38%" }} /></div></div><button className="support-link"><Info size={17} /> Documentation<ExternalLink size={13} /></button></div>
      </aside>

      {mobileNav && <button className="sidebar-backdrop" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}

      <div className="main-column">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={21} /></button><a className="mobile-top-brand" href="/"><BrandLogo /></a><div className="topbar-search"><Search size={17} /><span>Search projects, addresses, or proofs</span><kbd>⌘ K</kbd></div><div className="topbar-actions"><ThemeToggle compact /><div className={`network-badge ${networkError ? "network-error" : ""}`}><span />{networkError ? "RPC retrying" : "Coston2 live"}</div><button className="icon-button"><Bell size={18} /><i /></button>{wallet ? <button className="wallet-button connected" onClick={() => copyText(wallet)}><span className="wallet-avatar">H</span><p><strong>{shortAddress(wallet)}</strong><small>{walletBalance === null ? "Balance loading" : `${walletBalance.toFixed(2)} FXRP`}</small></p><ChevronDown size={14} /></button> : <button className="wallet-button" onClick={handleWallet} disabled={walletBusy}><WalletCards size={17} /><span>{walletBusy ? "Connecting…" : "Connect wallet"}</span></button>}</div></header>
        {walletError && <div className="toast-error"><Unplug size={16} /><span>{walletError}</span><button onClick={() => setWalletError("")}><X size={15} /></button></div>}
        <main>
          {view === "dashboard" && <Dashboard projects={visibleProjects} snapshot={snapshot} loadingNetwork={networkLoading} liveLoading={liveLoading} onRefreshNetwork={refreshNetwork} onOpenProject={openProject} onCreate={() => changeView("create")} />}
          {view === "project" && <ProjectDetail project={selected} onBack={() => changeView("dashboard")} />}
          {view === "create" && <CreateProject xrpPrice={snapshot?.xrpUsdPrice ?? 1.07} onCancel={() => changeView("dashboard")} onCreated={(project) => { setProjects((current) => [project, ...current]); openProject(project); }} />}
          {view === "activity" && <ActivityView />}
          {view === "settings" && <SettingsView snapshot={snapshot} />}
        </main>
        <footer><BrandLogo /><span className="footer-flare"><span className="footer-flare-icon"><Blocks size={14} /></span><small>Built on Flare</small></span><p>Experimental Coston2 prototype. Never use real funds.</p><div><a href="https://github.com/huzi0000/milestonex-flare" target="_blank" rel="noreferrer">GitHub <ExternalLink size={12} /></a><a href={COSTON2_EXPLORER} target="_blank" rel="noreferrer">Explorer <ExternalLink size={12} /></a></div></footer>
      </div>
    </div>
  );
}
