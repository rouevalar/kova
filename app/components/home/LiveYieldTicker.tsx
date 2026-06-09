"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

export function LiveYieldTicker() {
  const [display, setDisplay] = useState<number | null>(null);
  const [tickPerMs, setTickPerMs] = useState(0);
  const [serverTs, setServerTs] = useState(0);
  const [baseValue, setBaseValue] = useState(0);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(data => {
        if (data.totalYield == null) return;
        const base = Number(data.totalYield) / 1_000_000;
        const perSec = data.yieldPerSecond / 1_000_000;
        setBaseValue(base);
        setServerTs(data.timestamp);
        setTickPerMs(perSec / 1000);
        setDisplay(base);
      })
      .catch(() => setDisplay(0));
  }, []);

  useEffect(() => {
    if (display === null || tickPerMs === 0) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - serverTs;
      setDisplay(baseValue + elapsed * tickPerMs);
    }, 250);
    return () => clearInterval(interval);
  }, [baseValue, serverTs, tickPerMs, display]);

  const shown = display ?? 0;

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
        ${shown.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <TrendingUp size={16} style={{ color: "#C15F3C" }} />
    </div>
  );
}
