import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Blocks,
  Check,
  CircleDollarSign,
  ExternalLink,
  FileKey2,
  Gauge,
  HandCoins,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { COSTON2_EXPLORER } from "../lib/flare";
import { projectOneTransactions } from "../lib/milestonex";
import { deployment } from "../generated/deployment";

const steps = [
  { label: "Problem", eyebrow: "01 · THE TRUST GAP" },
  { label: "Product", eyebrow: "02 · THE WORKFLOW" },
  { label: "Flare", eyebrow: "03 · NATIVE INTEGRATION" },
  { label: "Proof", eyebrow: "04 · WORKING ONCHAIN" },
] as const;

export default function JudgeTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setStep((current) => Math.min(steps.length - 1, current + 1));
      if (event.key === "ArrowLeft") setStep((current) => Math.max(0, current - 1));
    };
    window.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", keydown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

  return (
    <div className="judge-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="judge-dialog" role="dialog" aria-modal="true" aria-label="MilestoneX judge tour">
        <header className="judge-header">
          <div className="judge-title"><span><Sparkles size={15} /></span><p><strong>MilestoneX Judge Mode</strong><small>60-second verified product tour</small></p></div>
          <div className="judge-progress">{steps.map((item, index) => <button key={item.label} className={index === step ? "active" : index < step ? "done" : ""} onClick={() => setStep(index)} aria-label={`Open ${item.label} step`}>{index < step ? <Check size={12} /> : index + 1}<span>{item.label}</span></button>)}</div>
          <button className="judge-close" onClick={onClose} aria-label="Close judge tour"><X size={18} /></button>
        </header>

        <div className="judge-body" key={step}>
          <span className="judge-eyebrow">{steps[step].eyebrow}</span>

          {step === 0 && <div className="judge-slide judge-problem">
            <div className="judge-copy"><h2>Global work starts with a trust problem.</h2><p>Clients hesitate to pay before delivery. Contractors hesitate to deliver before payment. A plain crypto transfer is fast—but it cannot represent project progress.</p><div className="judge-callout"><Users size={22} /><p><strong>MilestoneX protects both sides.</strong><span>Project value is locked before work moves forward, then released only when an agreed milestone is proven.</span></p></div></div>
            <div className="judge-image"><img src="/visuals/milestonex-hero.webp" alt="MilestoneX escrow vault and milestone path" /><span><ShieldCheck size={16} /> Non-custodial milestone escrow</span></div>
          </div>}

          {step === 1 && <div className="judge-slide judge-product">
            <div className="judge-copy"><h2>Agreement becomes a verifiable payment flow.</h2><p>Each action is explicit, role-controlled, and recorded on Coston2.</p></div>
            <div className="judge-flow">
              <article><span><FileKey2 size={20} /></span><small>01</small><h3>Agree</h3><p>Set USD milestones and a contractor wallet.</p></article>
              <i><ArrowRight size={16} /></i>
              <article><span><ShieldCheck size={20} /></span><small>02</small><h3>Lock</h3><p>Live-priced FXRP enters project escrow.</p></article>
              <i><ArrowRight size={16} /></i>
              <article><span><BadgeCheck size={20} /></span><small>03</small><h3>Prove</h3><p>Contractor commits an evidence hash.</p></article>
              <i><ArrowRight size={16} /></i>
              <article><span><HandCoins size={20} /></span><small>04</small><h3>Release</h3><p>Client releases the milestone payment.</p></article>
            </div>
            <div className="judge-result"><BadgeCheck size={19} /><span><strong>Result:</strong> no blind prepayment, no unpaid delivery, and no trapped FXRP.</span></div>
          </div>}

          {step === 2 && <div className="judge-slide judge-flare">
            <div className="judge-copy"><h2>Flare is core infrastructure—not a badge.</h2><p>Remove any one of these primitives and the product loses a core capability.</p></div>
            <div className="judge-stack">
              <article><span><CircleDollarSign size={24} /></span><div><small>FASSETS</small><h3>FXRP</h3><p>Makes XRP programmable inside the escrow contract.</p></div></article>
              <article><span><Gauge size={24} /></span><div><small>ENSHRINED ORACLE</small><h3>FTSOv2</h3><p>Converts USD milestones through decentralized XRP/USD pricing.</p></div></article>
              <article><span><Blocks size={24} /></span><div><small>FLARE TESTNET</small><h3>Coston2</h3><p>Provides execution, receipts, and public contract state.</p></div></article>
            </div>
            <a className="judge-contract" href={`${COSTON2_EXPLORER}/address/${deployment.milestoneEscrow}`} target="_blank" rel="noreferrer"><code>{deployment.milestoneEscrow}</code><span>Inspect deployed escrow <ExternalLink size={14} /></span></a>
          </div>}

          {step === 3 && <div className="judge-slide judge-proof">
            <div className="judge-copy"><h2>Project #1 proves the entire lifecycle.</h2><p>A real $5 test project funded and released <strong>4.663805 FXRP</strong>. Eleven automated checks passed and the final escrow balance is zero.</p></div>
            <div className="judge-metrics"><div><span>Project</span><strong>#1</strong></div><div><span>Funded</span><strong>4.663805</strong><small>FXRP</small></div><div><span>Released</span><strong>4.663805</strong><small>FXRP</small></div><div><span>Remaining</span><strong>0</strong><small>FXRP</small></div></div>
            <div className="judge-receipts">
              <a href={`${COSTON2_EXPLORER}/tx/${projectOneTransactions.created}`} target="_blank" rel="noreferrer"><span>01</span><p><strong>Project created</strong><small>Terms committed</small></p><ExternalLink size={14} /></a>
              <a href={`${COSTON2_EXPLORER}/tx/${projectOneTransactions.funded}`} target="_blank" rel="noreferrer"><span>02</span><p><strong>Escrow funded</strong><small>FXRP protected</small></p><ExternalLink size={14} /></a>
              <a href={`${COSTON2_EXPLORER}/tx/${projectOneTransactions.evidence}`} target="_blank" rel="noreferrer"><span>03</span><p><strong>Evidence submitted</strong><small>Hash recorded</small></p><ExternalLink size={14} /></a>
              <a href={`${COSTON2_EXPLORER}/tx/${projectOneTransactions.released}`} target="_blank" rel="noreferrer"><span>04</span><p><strong>Payment released</strong><small>Contractor paid</small></p><ExternalLink size={14} /></a>
            </div>
          </div>}
        </div>

        <footer className="judge-footer"><span>Use ← → keys to navigate</span><div><button className="judge-secondary" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}><ArrowLeft size={15} /> Back</button>{step < steps.length - 1 ? <button className="judge-primary" onClick={() => setStep((current) => current + 1)}>Next <ArrowRight size={15} /></button> : <a className="judge-primary" href="/lifecycle.html">Open lifecycle proof <ExternalLink size={14} /></a>}</div></footer>
      </section>
    </div>
  );
}
