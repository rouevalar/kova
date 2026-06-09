"use client";

import { useEffect, useState, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom } from "viem";
import {
  publicClient, arcTestnet, CAMPAIGN_ABI, ERC20_ABI, USDC_ADDRESS,
  getCampaignData, formatUsdc, parseUsdc
} from "@/lib/arc";
import { timeLeft, progressPercent, shortenAddress, categoryLabel } from "@/lib/utils";

import { Button } from "@/components/ui/Button";
import {
  Clock, Users, Lock, TrendingUp, ExternalLink, ArrowRight,
  CheckCircle, AlertTriangle, Eye, EyeOff
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface Campaign {
  owner: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  goal: bigint;
  deadline: bigint;
  privateMode: boolean;
  totalRaised: bigint;
  yieldEarned: bigint;
  finalized: boolean;
  goalReached: boolean;
  donorCount: bigint;
  createdAt: bigint;
  contractAddress: string;
}

interface Props {
  address: string;
}

export function CampaignDetail({ address }: Props) {
  const { authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [myContribution, setMyContribution] = useState<bigint>(BigInt(0));
  const [myYield, setMyYield] = useState<bigint>(BigInt(0));
  const [usdcBalance, setUsdcBalance] = useState<bigint>(BigInt(0));
  const [liveYield, setLiveYield] = useState<bigint>(BigInt(0));

  const isOwner = user?.wallet?.address?.toLowerCase() === campaign?.owner?.toLowerCase();
  const pct = campaign ? progressPercent(campaign.totalRaised, campaign.goal) : 0;
  const addr = address as `0x${string}`;

  const load = useCallback(async (retries = 3) => {
    try {
      const data = await getCampaignData(addr);
      setCampaign(data);
      setLiveYield(data.yieldEarned);
      setLoading(false);
    } catch (err) {
      if (retries > 0) {
        // Chain may still be indexing — wait and retry
        await new Promise(r => setTimeout(r, 1500));
        return load(retries - 1);
      }
      // Fall back to DB record so the page is never blank if on-chain read fails
      try {
        const res = await fetch(`/api/campaigns/${addr}`);
        if (res.ok) {
          const { campaign: db } = await res.json();
          if (db) {
            setCampaign({
              owner: db.owner_address,
              title: db.title,
              description: db.description,
              imageUrl: db.image_url ?? "",
              category: db.category,
              goal: BigInt(db.goal),
              deadline: BigInt(Math.floor(new Date(db.deadline).getTime() / 1000)),
              privateMode: db.private_mode,
              totalRaised: BigInt(db.total_raised),
              yieldEarned: BigInt(db.yield_earned),
              finalized: db.finalized,
              goalReached: db.goal_reached,
              donorCount: BigInt(db.donor_count),
              createdAt: BigInt(Math.floor(new Date(db.created_at).getTime() / 1000)),
              contractAddress: addr,
            });
            setLiveYield(BigInt(db.yield_earned));
            setLoading(false);
            return;
          }
        }
      } catch { /* DB fallback also failed */ }
      setCampaign(null);
      setLoading(false);
    }
  }, [addr]);

  useEffect(() => { load(); }, [load]);

  // Tick yield up every second
  useEffect(() => {
    if (!campaign || campaign.finalized) return;
    const RATE = BigInt(1585489599188); // per USDC per second in 1e18
    const interval = setInterval(() => {
      setLiveYield(prev => {
        const delta = (campaign.totalRaised * RATE) / BigInt(1e18);
        return prev + delta;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [campaign]);

  // Load my contribution
  useEffect(() => {
    if (!user?.wallet?.address || !campaign) return;
    const walletAddr = user.wallet.address as `0x${string}`;
    Promise.all([
      publicClient.readContract({ address: addr, abi: CAMPAIGN_ABI, functionName: "contributions", args: [walletAddr] }),
      publicClient.readContract({ address: addr, abi: CAMPAIGN_ABI, functionName: "donorYieldShare", args: [walletAddr] }),
      publicClient.readContract({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: "balanceOf", args: [walletAddr] }),
    ]).then(([contrib, yld, bal]) => {
      setMyContribution(contrib as bigint);
      setMyYield(yld as bigint);
      setUsdcBalance(bal as bigint);
    }).catch(console.error);
  }, [user, campaign, addr]);

  async function handleContribute() {
    if (!authenticated) { login(); return; }
    const wallet = wallets[0];
    if (!wallet) { toast.error("No wallet connected"); return; }
    const parsedAmount = parseUsdc(amount);
    if (parsedAmount <= BigInt(0)) { toast.error("Enter a valid amount"); return; }

    setContributing(true);
    try {
      await wallet.switchChain(5042002);
      const provider = await wallet.getEthereumProvider();
      const wc = createWalletClient({ chain: arcTestnet, transport: custom(provider) });
      const account = wallet.address as `0x${string}`;

      // Check allowance
      const allowance = await publicClient.readContract({
        address: USDC_ADDRESS, abi: ERC20_ABI, functionName: "allowance",
        args: [account, addr],
      }) as bigint;

      if (allowance < parsedAmount) {
        toast.loading("Approving USDC...", { id: "approve" });
        const approveTx = await wc.writeContract({
          address: USDC_ADDRESS, abi: ERC20_ABI, functionName: "approve",
          args: [addr, parsedAmount * BigInt(10)],
          account,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
        toast.dismiss("approve");
      }

      toast.loading("Submitting contribution...", { id: "contrib" });
      const tx = await wc.writeContract({
        address: addr, abi: CAMPAIGN_ABI, functionName: "contribute",
        args: [parsedAmount, campaign?.privateMode ? anonymous : false],
        account,
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      toast.dismiss("contrib");
      toast.success("Contribution confirmed.");

      // Save to DB
      await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAddress: addr,
          donorAddress: account,
          amount: parsedAmount.toString(),
          isAnonymous: campaign?.privateMode ? anonymous : false,
          txHash: tx,
        }),
      });

      setAmount("");
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      toast.dismiss("approve");
      toast.dismiss("contrib");
      toast.error(msg.includes("user rejected") ? "Cancelled." : "Something went wrong.");
    } finally {
      setContributing(false);
    }
  }

  async function handleFinalize() {
    const wallet = wallets[0];
    if (!wallet) return;
    setFinalizing(true);
    try {
      await wallet.switchChain(5042002);
      const provider = await wallet.getEthereumProvider();
      const wc = createWalletClient({ chain: arcTestnet, transport: custom(provider) });
      const tx = await wc.writeContract({
        address: addr, abi: CAMPAIGN_ABI, functionName: "finalize",
        account: wallet.address as `0x${string}`,
      });
      toast.loading("Finalizing...", { id: "fin" });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      toast.dismiss("fin");
      toast.success(campaign?.goalReached ? "Funds withdrawn." : "Refunds initiated.");
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg.includes("user rejected") ? "Cancelled." : "Failed to finalize.");
    } finally {
      setFinalizing(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 animate-pulse">
        <div className="h-8 w-2/3 rounded-xl shimmer mb-4" />
        <div className="h-4 w-1/3 rounded-lg shimmer mb-10" />
        <div className="h-64 rounded-2xl shimmer mb-6" />
        <div className="h-4 w-full rounded-lg shimmer mb-3" />
        <div className="h-4 w-3/4 rounded-lg shimmer" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-32 text-center">
        <AlertTriangle size={40} className="mx-auto mb-4" style={{ color: "#C15F3C" }} />
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}>
          Campaign not found
        </h1>
        <p style={{ color: "#B1ADA1" }}>This address doesn't have a Kova campaign on it.</p>
        <Link href="/campaigns" className="mt-6 inline-block text-sm" style={{ color: "#C15F3C" }}>
          Back to campaigns
        </Link>
      </div>
    );
  }

  const deadline = new Date(Number(campaign.deadline) * 1000);
  const isLive = !campaign.finalized && Date.now() < deadline.getTime();
  const canFinalize = isOwner && !campaign.finalized && (campaign.totalRaised >= campaign.goal || Date.now() >= deadline.getTime());

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid lg:grid-cols-[1fr_380px] gap-10">
        {/* Left */}
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-8" style={{ color: "#7A7269" }}>
            <Link href="/campaigns" className="hover:text-[#B1ADA1] transition-colors">Browse</Link>
            <ArrowRight size={12} />
            <span style={{ color: "#B1ADA1" }}>{campaign.title}</span>
          </div>

          {/* Category + title */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(193,95,60,0.1)", color: "#C15F3C" }}
            >
              {categoryLabel(campaign.category)}
            </span>
            {campaign.privateMode && (
              <span
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: "#161210", color: "#7A7269", border: "1px solid #2E2620" }}
              >
                <Lock size={10} /> Private donors
              </span>
            )}
            {campaign.finalized && (
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: "#2E2620", color: "#B1ADA1" }}
              >
                Ended
              </span>
            )}
          </div>

          <h1
            className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 leading-tight"
            style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}
          >
            {campaign.title}
          </h1>

          {/* Image */}
          {campaign.imageUrl && (
            <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "#161210" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={campaign.imageUrl} alt={campaign.title} className="w-full max-h-80 object-cover" />
            </div>
          )}

          {/* Description */}
          <div className="mb-8">
            <p className="text-base leading-relaxed" style={{ color: "#B1ADA1" }}>
              {campaign.description}
            </p>
          </div>

          {/* Yield live stats */}
          <div
            className="grid grid-cols-2 gap-4 p-5 rounded-2xl mb-6"
            style={{ background: "rgba(193,95,60,0.06)", border: "1px solid rgba(193,95,60,0.15)" }}
          >
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ fontFamily: "Space Mono, monospace", color: "#7A7269" }}>
                Raised
              </p>
              <p className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}>
                ${formatUsdc(campaign.totalRaised)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ fontFamily: "Space Mono, monospace", color: "#7A7269" }}>
                Yield earned
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ fontFamily: "Syne, sans-serif", color: "#C15F3C" }}>
                +${formatUsdc(liveYield, 4)}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2" style={{ color: "#7A7269" }}>
              <span>${formatUsdc(campaign.totalRaised)} raised of ${formatUsdc(campaign.goal)} goal</span>
              <span style={{ color: pct >= 100 ? "#C15F3C" : "#7A7269" }}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#2E2620" }}>
              <div className="progress-bar h-full" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-5 text-sm mb-8" style={{ color: "#7A7269" }}>
            <span className="flex items-center gap-1.5">
              <Users size={14} /> {campaign.donorCount.toString()} contributors
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} /> {timeLeft(deadline)}
            </span>
            <a
              href={`https://testnet.arcscan.app/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#B1ADA1] transition-colors"
            >
              <ExternalLink size={12} /> View on explorer
            </a>
          </div>

          {/* Owner */}
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{ background: "#161210", border: "1px solid #2E2620" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(193,95,60,0.15)" }}
            >
              <span className="text-xs font-bold" style={{ color: "#C15F3C" }}>
                {campaign.owner.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: "#7A7269" }}>Campaign by</p>
              <p className="text-sm font-medium" style={{ color: "#F4F3EE" }}>
                {shortenAddress(campaign.owner)}
                {isOwner && <span className="ml-2 text-xs" style={{ color: "#C15F3C" }}>(you)</span>}
              </p>
            </div>
          </div>

          {/* My contribution */}
          {myContribution > BigInt(0) && (
            <div
              className="mt-4 p-4 rounded-xl"
              style={{ background: "#161210", border: "1px solid #2E2620" }}
            >
              <p className="text-xs uppercase tracking-wider mb-3" style={{ fontFamily: "Space Mono, monospace", color: "#7A7269" }}>
                Your contribution
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs mb-1" style={{ color: "#7A7269" }}>Principal</p>
                  <p className="text-lg font-bold" style={{ color: "#F4F3EE", fontFamily: "Syne, sans-serif" }}>
                    ${formatUsdc(myContribution)}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: "#7A7269" }}>Your yield share</p>
                  <p className="text-lg font-bold" style={{ color: "#C15F3C", fontFamily: "Syne, sans-serif" }}>
                    +${formatUsdc(myYield, 4)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Finalize button */}
          {canFinalize && (
            <div className="mt-6">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                loading={finalizing}
                onClick={handleFinalize}
              >
                {campaign.totalRaised >= campaign.goal ? "Withdraw funds" : "Close and refund donors"}
              </Button>
              <p className="text-xs text-center mt-2" style={{ color: "#7A7269" }}>
                {campaign.totalRaised >= campaign.goal
                  ? "You'll receive everything raised plus yield, minus 1% fee."
                  : "All donors will automatically receive their contribution plus yield."}
              </p>
            </div>
          )}

          {campaign.finalized && (
            <div
              className="mt-6 flex items-center gap-3 p-4 rounded-xl"
              style={{ background: campaign.goalReached ? "rgba(193,95,60,0.07)" : "#161210", border: `1px solid ${campaign.goalReached ? "rgba(193,95,60,0.2)" : "#2E2620"}` }}
            >
              <CheckCircle size={18} style={{ color: "#C15F3C" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#F4F3EE" }}>
                  {campaign.goalReached ? "Campaign successful" : "Campaign ended"}
                </p>
                <p className="text-xs" style={{ color: "#7A7269" }}>
                  {campaign.goalReached
                    ? "Funds have been withdrawn by the campaign owner."
                    : "All contributors have been refunded with their yield share."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right — Contribute panel */}
        <div className="lg:sticky lg:top-[80px] lg:self-start">
          {isLive && !isOwner ? (
            <div
              className="rounded-2xl p-6"
              style={{ background: "#161210", border: "1px solid #2E2620" }}
            >
              <h2
                className="text-xl font-bold mb-1"
                style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}
              >
                Back this campaign
              </h2>
              <p className="text-sm mb-6" style={{ color: "#7A7269" }}>
                Your USDC earns yield from the moment it lands.
              </p>

              {authenticated ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: "#B1ADA1" }}>
                      Amount (USDC)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="100"
                        min="1"
                        step="any"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full px-4 py-3 pr-16 rounded-xl text-sm outline-none"
                        style={{
                          background: "#0E0B09",
                          border: "1px solid #2E2620",
                          color: "#F4F3EE",
                          fontFamily: "Space Grotesk, sans-serif",
                        }}
                        onFocus={e => (e.target.style.borderColor = "#C15F3C")}
                        onBlur={e => (e.target.style.borderColor = "#2E2620")}
                      />
                      <span
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium"
                        style={{ color: "#7A7269" }}
                      >
                        USDC
                      </span>
                    </div>
                    {usdcBalance > BigInt(0) && (
                      <p className="text-xs mt-1.5" style={{ color: "#7A7269" }}>
                        Balance: ${formatUsdc(usdcBalance)}
                        <button
                          className="ml-2 underline"
                          style={{ color: "#C15F3C" }}
                          onClick={() => setAmount(formatUsdc(usdcBalance, 6).replace(",", ""))}
                        >
                          Max
                        </button>
                      </p>
                    )}
                  </div>

                  {/* Quick amounts */}
                  <div className="flex gap-2 mb-4">
                    {[10, 50, 100, 500].map(v => (
                      <button
                        key={v}
                        onClick={() => setAmount(String(v))}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={
                          amount === String(v)
                            ? { background: "rgba(193,95,60,0.12)", color: "#C15F3C", border: "1px solid rgba(193,95,60,0.3)" }
                            : { background: "#0E0B09", color: "#7A7269", border: "1px solid #2E2620" }
                        }
                      >
                        ${v}
                      </button>
                    ))}
                  </div>

                  {/* Anonymous toggle */}
                  {campaign.privateMode && (
                    <button
                      onClick={() => setAnonymous(!anonymous)}
                      className="flex items-center gap-2 w-full text-sm mb-4 text-left"
                      style={{ color: anonymous ? "#C15F3C" : "#7A7269" }}
                    >
                      {anonymous ? <EyeOff size={14} /> : <Eye size={14} />}
                      {anonymous ? "Contributing anonymously" : "Contribute anonymously"}
                    </button>
                  )}

                  {/* Yield preview */}
                  {parseFloat(amount) > 0 && (
                    <div
                      className="p-3 rounded-xl mb-4"
                      style={{ background: "rgba(193,95,60,0.06)", border: "1px solid rgba(193,95,60,0.1)" }}
                    >
                      <p className="text-xs" style={{ color: "#7A7269" }}>
                        At 5% APY over {Math.ceil((deadline.getTime() - Date.now()) / 86400000)} days,
                        your ${parseFloat(amount).toFixed(2)} could earn{" "}
                        <span style={{ color: "#C15F3C" }}>
                          +${(parseFloat(amount) * 0.05 * ((deadline.getTime() - Date.now()) / (365 * 86400000))).toFixed(4)}
                        </span>
                      </p>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={contributing}
                    onClick={handleContribute}
                  >
                    Contribute <TrendingUp size={15} />
                  </Button>

                  <p className="text-xs text-center mt-3" style={{ color: "#7A7269" }}>
                    Gas is paid in USDC. No other token needed.
                  </p>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-center" style={{ color: "#B1ADA1" }}>
                    Connect to contribute
                  </p>
                  <Button variant="primary" size="lg" className="w-full" onClick={() => login()}>
                    Connect wallet
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div
              className="rounded-2xl p-6"
              style={{ background: "#161210", border: "1px solid #2E2620" }}
            >
              <div className="text-center py-6">
                {campaign.finalized ? (
                  <>
                    <CheckCircle size={32} className="mx-auto mb-3" style={{ color: "#C15F3C" }} />
                    <p className="font-semibold" style={{ color: "#F4F3EE", fontFamily: "Syne, sans-serif" }}>
                      Campaign ended
                    </p>
                    <p className="text-sm mt-1" style={{ color: "#7A7269" }}>
                      {campaign.goalReached ? "Goal was reached." : "Donors were refunded."}
                    </p>
                  </>
                ) : isOwner ? (
                  <>
                    <TrendingUp size={32} className="mx-auto mb-3" style={{ color: "#C15F3C" }} />
                    <p className="font-semibold" style={{ color: "#F4F3EE", fontFamily: "Syne, sans-serif" }}>
                      Your campaign
                    </p>
                    <p className="text-sm mt-1" style={{ color: "#7A7269" }}>
                      Watching it grow in real time.
                    </p>
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* Share */}
          {isLive && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: "#161210", border: "1px solid #2E2620" }}>
              <p className="text-xs mb-2" style={{ color: "#7A7269" }}>Share this campaign</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied.");
                }}
                className="w-full py-2 rounded-lg text-sm font-medium transition-all hover:scale-95"
                style={{ background: "#2E2620", color: "#B1ADA1" }}
              >
                Copy link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
