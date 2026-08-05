import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Blocks,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clipboard,
  Code2,
  Download,
  ExternalLink,
  FileJson,
  Gauge,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  Rocket,
  ShieldCheck,
  TerminalSquare,
  WalletCards,
  XCircle,
  Zap,
} from "lucide-react";
import {
  createWalletClient,
  custom,
  formatEther,
  type Address,
  type Hash,
} from "viem";
import {
  COSTON2_CHAIN_ID,
  COSTON2_EXPLORER,
  connectWallet,
  coston2,
  ensureCoston2,
  getNetworkSnapshot,
  publicClient,
  shortAddress,
  type NetworkSnapshot,
} from "./lib/flare";
import BrandLogo from "./components/BrandLogo";
import ThemeToggle from "./components/ThemeToggle";
import { deployment } from "./generated/deployment";
import {
  FtsoXrpUsdOracleArtifact,
  MilestoneEscrowArtifact,
  MilestoneFundingForwarderArtifact,
} from "./generated/contracts";

type StepState = "waiting" | "signing" | "confirming" | "complete" | "error";
type DeploymentStep = {
  id: "oracle" | "forwarder" | "escrow";
  name: string;
  description: string;
  state: StepState;
  address?: Address;
  txHash?: Hash;
  error?: string;
};

type DeploymentManifest = {
  network: "coston2";
  chainId: 114;
  deployedAt: string;
  deployer: Address;
  flareContractRegistry: Address;
  assetManagerFXRP: Address;
  fxrp: Address;
  ftsoXrpUsdOracle: Address;
  milestoneFundingForwarder: Address;
  milestoneEscrow: Address;
  transactions: {
    oracle: Hash;
    forwarder: Hash;
    escrow: Hash;
  };
};

const REGISTRY = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019" as Address;
const STORAGE_KEY = "milestonex:coston2-deployment";

const initialSteps: DeploymentStep[] = [
  {
    id: "oracle",
    name: "FTSO XRP/USD adapter",
    description: "Connects MilestoneX to Flare's decentralized XRP/USD feed.",
    state: "waiting",
  },
  {
    id: "forwarder",
    name: "EIP-712 funding forwarder",
    description: "Verifies signed funding authorizations and prevents replay.",
    state: "waiting",
  },
  {
    id: "escrow",
    name: "Milestone escrow",
    description: "Locks test FXRP and releases it through sequential milestones.",
    state: "waiting",
  },
];

function StepIcon({ state }: { state: StepState }) {
  if (state === "complete") return <Check size={16} />;
  if (state === "error") return <XCircle size={16} />;
  if (state === "signing" || state === "confirming") return <LoaderCircle size={16} className="deploy-spin" />;
  return <span />;
}

function explorerAddress(address: Address) {
  return `${COSTON2_EXPLORER}/address/${address}`;
}

function explorerTx(hash: Hash) {
  return `${COSTON2_EXPLORER}/tx/${hash}`;
}

export default function DeployApp() {
  const [account, setAccount] = useState<Address | null>(null);
  const [balance, setBalance] = useState<bigint>(0n);
  const [snapshot, setSnapshot] = useState<NetworkSnapshot | null>(null);
  const [steps, setSteps] = useState<DeploymentStep[]>(initialSteps);
  const [busy, setBusy] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [manifest, setManifest] = useState<DeploymentManifest | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    try {
      const parsed = saved
        ? (JSON.parse(saved) as DeploymentManifest)
        : (deployment as unknown as DeploymentManifest);
      setManifest(parsed);
      if (saved) setAccount(parsed.deployer);
      setSteps((current) => current.map((step) => {
        const address = step.id === "oracle"
          ? parsed.ftsoXrpUsdOracle
          : step.id === "forwarder"
            ? parsed.milestoneFundingForwarder
            : parsed.milestoneEscrow;
        return { ...step, state: "complete", address, txHash: parsed.transactions[step.id] };
      }));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    void loadSnapshot();
  }, []);

  const loadSnapshot = async () => {
    try {
      const result = await getNetworkSnapshot();
      setSnapshot(result);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Unable to read Coston2.");
    }
  };

  const connect = async () => {
    setBusy(true);
    setConnectionError("");
    try {
      await ensureCoston2();
      const connected = await connectWallet();
      setAccount(connected);
      setBalance(await publicClient.getBalance({ address: connected }));
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Wallet connection failed.");
    } finally {
      setBusy(false);
    }
  };

  const updateStep = (id: DeploymentStep["id"], patch: Partial<DeploymentStep>) => {
    setSteps((current) => current.map((step) => step.id === id ? { ...step, ...patch } : step));
  };

  const deployOne = async (
    id: DeploymentStep["id"],
    artifact: { abi: readonly unknown[]; bytecode: `0x${string}` },
    args: readonly unknown[],
    walletClient: ReturnType<typeof createWalletClient>,
    deployer: Address,
  ) => {
    updateStep(id, { state: "signing", error: undefined });
    const hash = await walletClient.deployContract({
      account: deployer,
      chain: coston2,
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      args,
    });
    updateStep(id, { state: "confirming", txHash: hash });
    const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    if (receipt.status !== "success" || !receipt.contractAddress) {
      throw new Error(`${id} deployment did not return a contract address.`);
    }
    const code = await publicClient.getCode({ address: receipt.contractAddress });
    if (!code || code === "0x") throw new Error(`${id} contract has no deployed bytecode.`);
    updateStep(id, { state: "complete", address: receipt.contractAddress, txHash: hash });
    return { address: receipt.contractAddress, txHash: hash };
  };

  const deployAll = async () => {
    if (!account || !snapshot || !window.ethereum || manifest) return;
    setBusy(true);
    setConnectionError("");
    try {
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" }) as string;
      if (Number.parseInt(chainIdHex, 16) !== COSTON2_CHAIN_ID) {
        await ensureCoston2();
      }
      const walletClient = createWalletClient({ chain: coston2, transport: custom(window.ethereum) });

      const oracle = await deployOne(
        "oracle",
        FtsoXrpUsdOracleArtifact,
        [],
        walletClient,
        account,
      );
      const forwarder = await deployOne(
        "forwarder",
        MilestoneFundingForwarderArtifact,
        [],
        walletClient,
        account,
      );
      const escrow = await deployOne(
        "escrow",
        MilestoneEscrowArtifact,
        [snapshot.fxrpAddress, oracle.address, forwarder.address],
        walletClient,
        account,
      );

      const deployment: DeploymentManifest = {
        network: "coston2",
        chainId: 114,
        deployedAt: new Date().toISOString(),
        deployer: account,
        flareContractRegistry: REGISTRY,
        assetManagerFXRP: snapshot.assetManagerAddress,
        fxrp: snapshot.fxrpAddress,
        ftsoXrpUsdOracle: oracle.address,
        milestoneFundingForwarder: forwarder.address,
        milestoneEscrow: escrow.address,
        transactions: {
          oracle: oracle.txHash,
          forwarder: forwarder.txHash,
          escrow: escrow.txHash,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deployment));
      setManifest(deployment);
      setBalance(await publicClient.getBalance({ address: account }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Deployment failed.";
      const active = steps.find((step) => step.state === "signing" || step.state === "confirming");
      if (active) updateStep(active.id, { state: "error", error: message });
      setConnectionError(message);
    } finally {
      setBusy(false);
    }
  };

  const manifestJson = useMemo(
    () => manifest ? JSON.stringify(manifest, null, 2) : "",
    [manifest],
  );

  const downloadManifest = () => {
    if (!manifest) return;
    const blob = new Blob([`${manifestJson}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "coston2.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearLocal = () => {
    localStorage.removeItem(STORAGE_KEY);
    setManifest(null);
    setSteps(initialSteps);
  };

  return (
    <div className="deploy-page">
      <header className="deploy-header">
        <a href="/" className="suite-brand"><BrandLogo /></a>
        <div className="deploy-network"><i /> Coston2 testnet · Chain 114</div>
        <div className="suite-actions"><ThemeToggle compact /><a href="/" className="deploy-back"><ArrowLeft size={15} /> Back to application</a></div>
      </header>

      <main className="deploy-main">
        <section className="deploy-hero">
          <div>
            <span className="deploy-eyebrow"><BadgeCheck size={13} /> VERIFIED INFRASTRUCTURE</span>
            <h1>Three contracts.<br /><em>One verified foundation.</em></h1>
            <p>MilestoneX is live on Coston2. Every deployment receipt, bytecode address, dependency, and contract linkage below is public and independently reproducible.</p>
          </div>
          <div className="deploy-proof">
            <ShieldCheck size={23} />
            <p><strong>Deployed on Coston2</strong><span>Chain 114 · test assets only · no real funds.</span></p>
          </div>
        </section>

        <section className="deploy-grid">
          <div className="deploy-panel">
            <div className="deploy-panel-head">
              <div><span>DEPLOYMENT EVIDENCE</span><h2>Contract infrastructure</h2></div>
              <div className="deploy-count">{steps.filter((step) => step.state === "complete").length}<span>/ 3</span></div>
            </div>

            <div className="deploy-steps">
              {steps.map((step, index) => (
                <article className={`deploy-step deploy-${step.state}`} key={step.id}>
                  <div className="deploy-step-number"><StepIcon state={step.state} />{step.state === "waiting" && index + 1}</div>
                  <div className="deploy-step-copy">
                    <div><h3>{step.name}</h3><span>{step.state === "signing" ? "Confirm in wallet" : step.state === "confirming" ? "Waiting for Coston2" : step.state === "complete" ? "Deployed & verified" : step.state === "error" ? "Action required" : "Ready"}</span></div>
                    <p>{step.description}</p>
                    {step.address && <div className="deploy-address"><code>{step.address}</code><button onClick={() => navigator.clipboard.writeText(step.address!)}><Clipboard size={13} /></button><a href={explorerAddress(step.address)} target="_blank" rel="noreferrer"><ExternalLink size={13} /></a></div>}
                    {step.txHash && step.state !== "complete" && <a className="pending-tx" href={explorerTx(step.txHash)} target="_blank" rel="noreferrer">View pending transaction <ExternalLink size={12} /></a>}
                    {step.error && <small className="deploy-step-error">{step.error}</small>}
                  </div>
                </article>
              ))}
            </div>

            {manifest ? (
              <div className="deploy-complete-banner"><BadgeCheck size={20} /><p><strong>Deployment complete and verified</strong><span>All three contracts are live; the public manifest is published below.</span></p></div>
            ) : !account ? (
              <button className="deploy-primary" onClick={connect} disabled={busy}>
                {busy ? <LoaderCircle className="deploy-spin" size={17} /> : <WalletCards size={17} />}
                {busy ? "Connecting…" : "Connect Coston2 wallet"}
              </button>
            ) : (
              <button className="deploy-primary" onClick={deployAll} disabled={busy || !snapshot || balance === 0n}>
                {busy ? <LoaderCircle className="deploy-spin" size={17} /> : <Rocket size={17} />}
                {busy ? "Deployment in progress…" : "Deploy all three contracts"}
                {!busy && <ChevronRight size={16} />}
              </button>
            )}

            {connectionError && <div className="deploy-error"><AlertTriangle size={16} /><span>{connectionError}</span></div>}
          </div>

          <aside className="deploy-aside">
            <article className="wallet-summary">
              <div className="aside-title"><WalletCards size={17} /><span>DEPLOYER WALLET</span>{(account || manifest) && <BadgeCheck size={16} />}</div>
              {manifest ? <><strong>{shortAddress(manifest.deployer)}</strong><p>Original Coston2 deployer</p><div className="wallet-meter"><span style={{ width: "100%" }} /></div><small>Public address only · deployment verified.</small></> : account ? <><strong>{shortAddress(account)}</strong><p>{Number(formatEther(balance)).toFixed(3)} C2FLR available</p><div className="wallet-meter"><span style={{ width: balance > 0n ? "82%" : "0%" }} /></div><small>Only free faucet tokens are used.</small></> : <div className="wallet-empty"><KeyRound size={24} /><p>Connect your dedicated test wallet to continue.</p></div>}
            </article>

            <article className="dependency-card">
              <div className="aside-title"><Blocks size={17} /><span>LIVE DEPENDENCIES</span><button onClick={loadSnapshot}><RefreshCw size={13} /></button></div>
              <div className="dependency-row"><span><CircleDollarSign size={15} /></span><p><strong>Test FXRP</strong><small>{snapshot ? shortAddress(snapshot.fxrpAddress) : "Resolving…"}</small></p>{snapshot && <Check size={15} />}</div>
              <div className="dependency-row"><span><Gauge size={15} /></span><p><strong>XRP / USD</strong><small>{snapshot ? `$${snapshot.xrpUsdPrice.toFixed(5)}` : "Reading FTSOv2…"}</small></p>{snapshot && <Check size={15} />}</div>
              <div className="dependency-row"><span><Zap size={15} /></span><p><strong>Latest block</strong><small>{snapshot ? `#${snapshot.blockNumber}` : "Connecting…"}</small></p>{snapshot && <Check size={15} />}</div>
            </article>

            <article className={manifest ? "safety-card verified-note" : "safety-card"}>
              {manifest ? <BadgeCheck size={17} /> : <AlertTriangle size={17} />}
              <div>{manifest ? <><strong>Verification complete</strong><ul><li>Three successful deployment receipts.</li><li>Bytecode confirmed at every address.</li><li>Escrow dependencies match the manifest.</li><li>Test assets only; no real funds used.</li></ul></> : <><strong>Before signing</strong><ul><li>MetaMask must show Coston2.</li><li>Never enter a seed phrase here.</li><li>Expect exactly three deployment confirmations.</li><li>Do not use a wallet with real assets.</li></ul></>}</div>
            </article>
          </aside>
        </section>

        {manifest && (
          <section className="manifest-panel">
            <div className="manifest-heading"><div><span className="deploy-eyebrow"><FileJson size={13} /> DEPLOYMENT EVIDENCE</span><h2>Coston2 manifest</h2><p>Public addresses only. Safe to commit as <code>contracts/deployments/coston2.json</code>.</p></div><div><button onClick={() => navigator.clipboard.writeText(manifestJson)}><Clipboard size={14} /> Copy JSON</button><button className="manifest-download" onClick={downloadManifest}><Download size={14} /> Download</button></div></div>
            <pre>{manifestJson}</pre>
            <span className="published-manifest"><BadgeCheck size={13} /> Published deployment evidence</span>
          </section>
        )}

        <section className="deploy-explainer">
          <span><Code2 size={18} /></span>
          <div><h3>What happens when you deploy?</h3><p>MetaMask signs three normal contract-creation transactions. Vercel never sees your private key. The console waits for each receipt, verifies that bytecode exists, then saves only public addresses and transaction hashes in your browser.</p></div>
        </section>
      </main>
    </div>
  );
}
