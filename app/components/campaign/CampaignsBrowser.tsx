"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { CampaignCard } from "@/components/campaign/CampaignCard";
import { CampaignCardSkeleton } from "@/components/campaign/CampaignCardSkeleton";

const CATEGORIES = ["all", "medical", "education", "emergency", "community", "legal", "creative", "general"];

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

export function CampaignsBrowser() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showEnded, setShowEnded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (category !== "all") params.set("category", category);
      if (showEnded) params.set("finalized", "true");
      const res = await fetch(`/api/campaigns?${params}`);
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [category, showEnded]);

  useEffect(() => { load(); }, [load]);

  const filtered = campaigns.filter(c =>
    search.trim() === "" ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-10">
        <p
          className="text-xs uppercase tracking-[0.18em] mb-5"
          style={{ fontFamily: "Space Mono, monospace", color: "#7A7269" }}
        >
          Browse
        </p>
        <h1
          className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3"
          style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}
        >
          Every campaign earns.
        </h1>
        <p className="text-lg" style={{ color: "#B1ADA1" }}>
          Browse live campaigns. Every dollar here is working.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#7A7269" }} />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: "#161210",
              border: "1px solid #2E2620",
              color: "#F4F3EE",
              fontFamily: "Space Grotesk, sans-serif",
            }}
            onFocus={e => (e.target.style.borderColor = "#C15F3C")}
            onBlur={e => (e.target.style.borderColor = "#2E2620")}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "#7A7269" }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-150"
              style={
                category === cat
                  ? { background: "rgba(193,95,60,0.12)", color: "#C15F3C", border: "1px solid rgba(193,95,60,0.3)" }
                  : { background: "#161210", color: "#7A7269", border: "1px solid #2E2620" }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Ended toggle */}
        <button
          onClick={() => setShowEnded(!showEnded)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={
            showEnded
              ? { background: "rgba(193,95,60,0.12)", color: "#C15F3C", border: "1px solid rgba(193,95,60,0.3)" }
              : { background: "#161210", color: "#7A7269", border: "1px solid #2E2620" }
          }
        >
          <SlidersHorizontal size={12} />
          {showEnded ? "Showing ended" : "Show ended"}
        </button>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm mb-6" style={{ color: "#7A7269" }}>
          {filtered.length} campaign{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <CampaignCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-2xl"
          style={{ background: "#161210", border: "1px solid #2E2620" }}
        >
          <p className="text-lg font-semibold mb-2" style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}>
            Nothing here yet
          </p>
          <p className="text-sm" style={{ color: "#7A7269" }}>
            {search ? "Try a different search." : "Be the first to start a campaign."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(c => (
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
      )}
    </div>
  );
}
