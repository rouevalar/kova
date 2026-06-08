"use client";

import Link from "next/link";
import { Clock, Users, Lock, TrendingUp } from "lucide-react";
import { formatUsdc } from "@/lib/arc";
import { timeLeft, categoryLabel, progressPercent } from "@/lib/utils";

interface CampaignCardProps {
  contractAddress: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  category: string;
  goal: string | bigint;
  totalRaised: string | bigint;
  yieldEarned: string | bigint;
  deadline: Date | string;
  privateMode: boolean;
  finalized: boolean;
  donorCount: number;
}

export function CampaignCard({
  contractAddress,
  title,
  description,
  imageUrl,
  category,
  goal,
  totalRaised,
  yieldEarned,
  deadline,
  privateMode,
  finalized,
  donorCount,
}: CampaignCardProps) {
  const goalBig   = typeof goal        === "bigint" ? goal        : BigInt(goal || "0");
  const raisedBig = typeof totalRaised === "bigint" ? totalRaised : BigInt(totalRaised || "0");
  const yieldBig  = typeof yieldEarned === "bigint" ? yieldEarned : BigInt(yieldEarned || "0");
  const pct = progressPercent(raisedBig, goalBig);
  const deadlineDate = typeof deadline === "string" ? new Date(deadline) : deadline;

  return (
    <Link href={`/campaigns/${contractAddress}`} className="block group">
      <article
        className="card-hover rounded-2xl overflow-hidden h-full flex flex-col"
        style={{ background: "#161210", border: "1px solid #2E2620" }}
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden shrink-0" style={{ background: "#1E1916" }}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1E1916 0%, #2E2620 100%)" }}
            >
              <TrendingUp size={36} style={{ color: "#C15F3C", opacity: 0.25 }} />
            </div>
          )}

          <div className="absolute top-3 left-3 flex gap-1.5">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(14,11,9,0.85)", color: "#B1ADA1", backdropFilter: "blur(8px)" }}
            >
              {categoryLabel(category)}
            </span>
            {privateMode && (
              <span
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: "rgba(14,11,9,0.85)", color: "#C15F3C", backdropFilter: "blur(8px)" }}
              >
                <Lock size={9} /> Private
              </span>
            )}
          </div>

          {finalized && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(14,11,9,0.65)" }}>
              <span className="px-3 py-1.5 rounded-full text-sm font-semibold" style={{ background: "#2E2620", color: "#B1ADA1" }}>
                Ended
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3
            className="font-bold text-base leading-snug mb-1.5 line-clamp-1"
            style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}
          >
            {title}
          </h3>
          <p className="text-sm leading-relaxed line-clamp-2 mb-4 flex-1" style={{ color: "#7A7269" }}>
            {description}
          </p>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: "#7A7269" }}>
              <span>${formatUsdc(raisedBig)} raised</span>
              <span style={{ color: pct >= 100 ? "#C15F3C" : "#7A7269" }}>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#2E2620" }}>
              <div className="progress-bar h-full" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs" style={{ color: "#7A7269" }}>
              <span className="flex items-center gap-1"><Users size={11} /> {donorCount}</span>
              <span className="flex items-center gap-1"><Clock size={11} /> {timeLeft(deadlineDate)}</span>
            </div>
            {yieldBig > BigInt(0) && (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(193,95,60,0.12)", color: "#C15F3C" }}
              >
                <TrendingUp size={9} />
                +${formatUsdc(yieldBig, 2)}
              </span>
            )}
          </div>

          <div className="mt-3 pt-3 flex justify-between items-center" style={{ borderTop: "1px solid #2E2620" }}>
            <span className="text-xs font-medium" style={{ color: "#B1ADA1" }}>
              Goal: ${formatUsdc(goalBig)}
            </span>
            <span className="text-xs" style={{ color: "#7A7269" }}>
              USDC
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
