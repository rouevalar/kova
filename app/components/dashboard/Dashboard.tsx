"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { TrendingUp, Plus, AlertCircle } from "lucide-react";
import { CampaignCard } from "@/components/campaign/CampaignCard";
import { Button } from "@/components/ui/Button";
import { formatUsdc } from "@/lib/arc";

interface Campaign {
  contract_address: string;
  title: string;
  description: string;
  image_url: string | null;
  category: string;
  goal: string;
  total_raised: string;
  yield_earned: string;
  deadline: string;
  private_mode: boolean;
  finalized: boolean;
  donor_count: number;
}

interface Contribution {
  id: string;
  contract_address: string;
  amount: string;
  is_anonymous: boolean;
  created_at: string;
  campaign_title?: string;
  yield_earned?: string;
}

export function Dashboard() {
  const { authenticated, login, user } = usePrivy();
  const [tab, setTab] = useState<"created" | "contributions">("created");
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [myContributions, setMyContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalContributed, setTotalContributed] = useState(BigInt(0));
  const [totalYield, setTotalYield] = useState(BigInt(0));

  useEffect(() => {
    if (!authenticated || !user?.wallet?.address) return;
    const addr = user.wallet.address.toLowerCase();
    setLoading(true);

    Promise.all([
      fetch(`/api/campaigns?owner=${addr}`).then(r => r.json()),
      fetch(`/api/contributions?donor=${addr}`).then(r => r.json()),
    ]).then(([campaignsData, contribData]) => {
      setMyCampaigns(campaignsData.campaigns || []);
      const contribs: Contribution[] = contribData.contributions || [];
      setMyContributions(contribs);
      const total = contribs.reduce((acc, c) => acc + BigInt(c.amount || "0"), BigInt(0));
      const yld = contribs.reduce((acc, c) => acc + BigInt(c.yield_earned || "0"), BigInt(0));
      setTotalContributed(total);
      setTotalYield(yld);
    }).catch(console.error).finally(() => setLoading(false));
  }, [authenticated, user]);

  if (!authenticated) {
    return (
      <div className="max-w-lg mx-auto px-6 py-32 text-center">
        <AlertCircle size={40} className="mx-auto mb-4" style={{ color: "#C15F3C" }} />
        <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}>
          Your dashboard
        </h1>
        <p className="mb-6" style={{ color: "#B1ADA1" }}>
          Connect your wallet to see your campaigns and contributions.
        </p>
        <Button onClick={() => login()} variant="primary" size="lg">
          Connect wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-10">
        <div>
          <p
            className="text-xs uppercase tracking-[0.18em] mb-4"
            style={{ fontFamily: "Space Mono, monospace", color: "#7A7269" }}
          >
            Dashboard
          </p>
          <h1
            className="text-4xl font-extrabold tracking-tight"
            style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}
          >
            Your impact.
          </h1>
        </div>
        <Link href="/campaigns/new">
          <Button variant="primary" className="gap-2">
            <Plus size={15} strokeWidth={2.5} />
            New campaign
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Campaigns created", value: myCampaigns.length },
          { label: "Total contributed", value: `$${formatUsdc(totalContributed)}` },
          { label: "Yield earned", value: `$${formatUsdc(totalYield, 4)}` },
          { label: "Campaigns backed", value: myContributions.length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="p-5 rounded-2xl"
            style={{ background: "#161210", border: "1px solid #2E2620" }}
          >
            <p className="text-2xl font-bold mb-1" style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}>
              {value}
            </p>
            <p className="text-xs" style={{ color: "#7A7269" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8" style={{ borderBottom: "1px solid #2E2620", paddingBottom: "1px" }}>
        {(["created", "contributions"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2.5 text-sm font-medium capitalize transition-all"
            style={{
              borderBottom: tab === t ? "2px solid #C15F3C" : "2px solid transparent",
              color: tab === t ? "#F4F3EE" : "#7A7269",
              marginBottom: "-1px",
            }}
          >
            {t === "created" ? "My campaigns" : "My contributions"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-2xl shimmer" />
          ))}
        </div>
      ) : tab === "created" ? (
        myCampaigns.length === 0 ? (
          <div
            className="flex flex-col items-center py-20 rounded-2xl"
            style={{ background: "#161210", border: "1px solid #2E2620" }}
          >
            <TrendingUp size={36} className="mb-4" style={{ color: "#C15F3C", opacity: 0.4 }} />
            <p className="text-lg font-semibold mb-2" style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}>
              No campaigns yet
            </p>
            <p className="text-sm mb-6" style={{ color: "#7A7269" }}>Start one and watch the yield roll in.</p>
            <Link href="/campaigns/new">
              <Button variant="primary">Start a campaign</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCampaigns.map(c => (
              <CampaignCard
                key={c.contract_address}
                contractAddress={c.contract_address}
                title={c.title}
                description={c.description}
                imageUrl={c.image_url}
                category={c.category}
                goal={c.goal}
                totalRaised={c.total_raised}
                yieldEarned={c.yield_earned}
                deadline={c.deadline}
                privateMode={c.private_mode}
                finalized={c.finalized}
                donorCount={c.donor_count}
              />
            ))}
          </div>
        )
      ) : (
        myContributions.length === 0 ? (
          <div
            className="flex flex-col items-center py-20 rounded-2xl"
            style={{ background: "#161210", border: "1px solid #2E2620" }}
          >
            <TrendingUp size={36} className="mb-4" style={{ color: "#C15F3C", opacity: 0.4 }} />
            <p className="text-lg font-semibold mb-2" style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}>
              No contributions yet
            </p>
            <p className="text-sm mb-6" style={{ color: "#7A7269" }}>Find a campaign worth backing.</p>
            <Link href="/campaigns">
              <Button variant="secondary">Browse campaigns</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myContributions.map(c => (
              <Link
                key={c.id}
                href={`/campaigns/${c.contract_address}`}
                className="flex items-center justify-between p-4 rounded-xl transition-all hover:border-[rgba(193,95,60,0.3)]"
                style={{ background: "#161210", border: "1px solid #2E2620" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "#F4F3EE" }}>
                    {c.campaign_title || c.contract_address.slice(0, 16) + "..."}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#7A7269" }}>
                    {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {c.is_anonymous && " · anonymous"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: "#F4F3EE" }}>
                    ${formatUsdc(BigInt(c.amount))}
                  </p>
                  {c.yield_earned && BigInt(c.yield_earned) > BigInt(0) && (
                    <p className="text-xs" style={{ color: "#C15F3C" }}>
                      +${formatUsdc(BigInt(c.yield_earned), 4)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
