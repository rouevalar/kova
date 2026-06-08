"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { createWalletClient, custom, parseUnits, encodeFunctionData } from "viem";
import { arcTestnet, FACTORY_ADDRESS, FACTORY_ABI, parseUsdc } from "@/lib/arc";
import { Button } from "@/components/ui/Button";
import { Lock, AlertCircle, Calendar, Target, Tag } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = ["medical", "education", "emergency", "community", "legal", "creative", "general"];

export function CreateCampaignForm() {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    category: "general",
    goal: "",
    durationDays: "30",
    privateMode: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "deploying" | "saving">("form");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const goalNum = parseFloat(form.goal) || 0;
  const days = parseInt(form.durationDays) || 30;
  const estimatedYield = goalNum * 0.05 * (days / 365);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authenticated) { login(); return; }
    if (!form.title || !form.description || !form.goal || goalNum <= 0) {
      toast.error("Fill in all required fields");
      return;
    }

    const wallet = wallets[0];
    if (!wallet) { toast.error("No wallet connected"); return; }

    setSubmitting(true);
    setStep("deploying");

    try {
      await wallet.switchChain(5042002);
      const provider = await wallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: arcTestnet,
        transport: custom(provider),
      });

      const deadlineTimestamp = BigInt(Math.floor(Date.now() / 1000) + days * 86400);
      const goalUsdc = parseUsdc(form.goal);

      const hash = await walletClient.writeContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "createCampaign",
        args: [
          form.title,
          form.description,
          form.imageUrl,
          form.category,
          goalUsdc,
          deadlineTimestamp,
          form.privateMode,
        ],
        account: wallet.address as `0x${string}`,
      });

      toast.loading("Waiting for confirmation...", { id: "tx" });

      // Poll for receipt
      let contractAddress: `0x${string}` | null = null;
      let attempts = 0;
      while (!contractAddress && attempts < 30) {
        await new Promise(r => setTimeout(r, 1500));
        try {
          const { publicClient } = await import("@/lib/arc");
          const receipt = await publicClient.getTransactionReceipt({ hash });
          if (receipt?.logs?.[0]) {
            const log = receipt.logs[0];
            contractAddress = log.address as `0x${string}`;
            // factory emits CampaignCreated — campaign address is in topics[1]
            if (receipt.logs.length > 0) {
              const lastLog = receipt.logs[receipt.logs.length - 1];
              // The campaign contract address comes from the factory log
              // Look for CampaignCreated event - campaign address in topics
              for (const l of receipt.logs) {
                if (l.address.toLowerCase() === FACTORY_ADDRESS.toLowerCase()) {
                  // topics[1] = campaign address (padded)
                  if (l.topics[1]) {
                    contractAddress = `0x${l.topics[1].slice(26)}` as `0x${string}`;
                  }
                }
              }
            }
          }
        } catch { /* still waiting */ }
        attempts++;
      }

      toast.dismiss("tx");

      if (!contractAddress) {
        toast.error("Could not find deployed contract. Check the explorer.");
        setSubmitting(false);
        setStep("form");
        return;
      }

      setStep("saving");
      // Save to DB
      await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAddress,
          ownerAddress: wallet.address,
          title: form.title,
          description: form.description,
          imageUrl: form.imageUrl || null,
          category: form.category,
          goal: goalUsdc.toString(),
          deadline: Math.floor(Date.now() / 1000) + days * 86400,
          privateMode: form.privateMode,
          txHash: hash,
        }),
      });

      toast.success("Campaign is live.");
      router.push(`/campaigns/${contractAddress}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      toast.error(msg.includes("user rejected") ? "Cancelled." : "Something went wrong. Try again.");
      console.error(err);
      setSubmitting(false);
      setStep("form");
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all";
  const inputStyle: React.CSSProperties = {
    background: "#161210",
    border: "1px solid #2E2620",
    color: "#F4F3EE",
    fontFamily: "Space Grotesk, sans-serif",
  };
  const labelClass = "block text-sm font-medium mb-2";
  const labelStyle: React.CSSProperties = { color: "#B1ADA1" };

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p
          className="text-xs uppercase tracking-[0.18em] mb-5"
          style={{ fontFamily: "Space Mono, monospace", color: "#7A7269" }}
        >
          New campaign
        </p>
        <h1
          className="text-4xl font-extrabold tracking-tight mb-3"
          style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}
        >
          Tell us what you need.
        </h1>
        <p style={{ color: "#B1ADA1" }}>
          Your campaign deploys as a smart contract. Every contribution earns from the moment it lands.
        </p>
      </div>

      {!authenticated ? (
        <div
          className="flex flex-col items-center gap-4 py-16 rounded-2xl"
          style={{ background: "#161210", border: "1px solid #2E2620" }}
        >
          <AlertCircle size={32} style={{ color: "#C15F3C" }} />
          <p style={{ color: "#B1ADA1" }}>Connect your wallet to start a campaign.</p>
          <Button onClick={() => login()} variant="primary">Connect wallet</Button>
        </div>
      ) : step === "deploying" ? (
        <div
          className="flex flex-col items-center gap-4 py-20 rounded-2xl"
          style={{ background: "#161210", border: "1px solid #2E2620" }}
        >
          <div
            className="w-12 h-12 rounded-full border-2 animate-spin"
            style={{ borderColor: "#C15F3C", borderTopColor: "transparent" }}
          />
          <p className="font-semibold" style={{ color: "#F4F3EE", fontFamily: "Syne, sans-serif" }}>
            Deploying your campaign...
          </p>
          <p className="text-sm text-center max-w-xs" style={{ color: "#7A7269" }}>
            Confirm the transaction in your wallet. Arc settles in under a second.
          </p>
        </div>
      ) : step === "saving" ? (
        <div
          className="flex flex-col items-center gap-4 py-20 rounded-2xl"
          style={{ background: "#161210", border: "1px solid #2E2620" }}
        >
          <div
            className="w-12 h-12 rounded-full border-2 animate-spin"
            style={{ borderColor: "#C15F3C", borderTopColor: "transparent" }}
          />
          <p className="font-semibold" style={{ color: "#F4F3EE", fontFamily: "Syne, sans-serif" }}>
            One moment...
          </p>
          <p className="text-sm" style={{ color: "#7A7269" }}>Saving campaign details.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className={labelClass} style={labelStyle}>Campaign title *</label>
            <input
              type="text"
              placeholder="Something clear and human"
              value={form.title}
              onChange={set("title")}
              required
              className={inputClass}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#C15F3C")}
              onBlur={e => (e.target.style.borderColor = "#2E2620")}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass} style={labelStyle}>Description *</label>
            <textarea
              placeholder="Tell people what this is for. Be specific, be honest."
              value={form.description}
              onChange={set("description")}
              required
              rows={5}
              className={`${inputClass} resize-none`}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#C15F3C")}
              onBlur={e => (e.target.style.borderColor = "#2E2620")}
            />
          </div>

          {/* Image URL */}
          <div>
            <label className={labelClass} style={labelStyle}>
              Cover image URL <span style={{ color: "#7A7269" }}>(optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={form.imageUrl}
              onChange={set("imageUrl")}
              className={inputClass}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#C15F3C")}
              onBlur={e => (e.target.style.borderColor = "#2E2620")}
            />
          </div>

          {/* Category + Goal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "6px" }}>
                <Tag size={13} /> Category
              </label>
              <select
                value={form.category}
                onChange={set("category")}
                className={inputClass}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c} style={{ background: "#161210" }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "6px" }}>
                <Target size={13} /> Goal (USDC) *
              </label>
              <input
                type="number"
                placeholder="5000"
                min="1"
                step="any"
                value={form.goal}
                onChange={set("goal")}
                required
                className={inputClass}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#C15F3C")}
                onBlur={e => (e.target.style.borderColor = "#2E2620")}
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className={labelClass} style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={13} /> Duration
            </label>
            <div className="flex items-center gap-3">
              {[7, 14, 30, 60, 90].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, durationDays: String(d) }))}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={
                    form.durationDays === String(d)
                      ? { background: "rgba(193,95,60,0.12)", color: "#C15F3C", border: "1px solid rgba(193,95,60,0.3)" }
                      : { background: "#161210", color: "#7A7269", border: "1px solid #2E2620" }
                  }
                >
                  {d}d
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="365"
                placeholder="Custom"
                value={[7, 14, 30, 60, 90].includes(days) ? "" : form.durationDays}
                onChange={set("durationDays")}
                className="w-24 px-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: "#161210", border: "1px solid #2E2620", color: "#F4F3EE" }}
              />
            </div>
          </div>

          {/* Privacy toggle */}
          <div
            className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
            style={{ background: "#161210", border: "1px solid #2E2620" }}
            onClick={() => setForm(p => ({ ...p, privateMode: !p.privateMode }))}
          >
            <div className="flex items-start gap-3">
              <Lock size={16} className="mt-0.5 shrink-0" style={{ color: form.privateMode ? "#C15F3C" : "#7A7269" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "#F4F3EE" }}>Private donor list</p>
                <p className="text-xs mt-0.5" style={{ color: "#7A7269" }}>
                  Contributors can choose to donate without their wallet address being visible.
                </p>
              </div>
            </div>
            <div
              className="w-10 h-6 rounded-full relative transition-all shrink-0 ml-4"
              style={{ background: form.privateMode ? "#C15F3C" : "#2E2620" }}
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full transition-all"
                style={{
                  background: "#F4F3EE",
                  left: form.privateMode ? "calc(100% - 20px)" : "4px",
                }}
              />
            </div>
          </div>

          {/* Yield preview */}
          {goalNum > 0 && (
            <div
              className="p-4 rounded-xl"
              style={{ background: "rgba(193,95,60,0.06)", border: "1px solid rgba(193,95,60,0.15)" }}
            >
              <p className="text-xs uppercase tracking-wider mb-2" style={{ fontFamily: "Space Mono, monospace", color: "#7A7269" }}>
                Estimated yield at 5% APY over {days} days
              </p>
              <p className="text-xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#C15F3C" }}>
                +${estimatedYield.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs mt-1" style={{ color: "#7A7269" }}>
                Kova takes 1% of this yield as its fee. Your donors keep the rest.
              </p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full"
          >
            Deploy campaign
          </Button>

          <p className="text-xs text-center" style={{ color: "#7A7269" }}>
            Deploying creates a smart contract on Arc Testnet. Gas fees are paid in USDC.
          </p>
        </form>
      )}
    </div>
  );
}
