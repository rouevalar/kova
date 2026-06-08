"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

export function LiveYieldTicker() {
  const [yield_, setYield] = useState(0);

  // Simulate a slowly climbing yield number
  useEffect(() => {
    const base = 12_847.32;
    setYield(base);
    const interval = setInterval(() => {
      setYield((prev) => prev + Math.random() * 0.004);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl"
      style={{ background: "rgba(193,95,60,0.07)", border: "1px solid rgba(193,95,60,0.15)" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full pulse-dot"
          style={{ background: "#C15F3C" }}
        />
        <span className="text-sm" style={{ color: "#7A7269", fontFamily: "Space Mono, monospace" }}>
          Total yield generated
        </span>
      </div>
      <span
        className="text-xl font-bold tabular-nums"
        style={{ fontFamily: "Space Mono, monospace", color: "#C15F3C" }}
      >
        ${yield_.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <TrendingUp size={16} style={{ color: "#C15F3C" }} />
    </div>
  );
}
