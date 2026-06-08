import { X, Check } from "lucide-react";

const compare = [
  {
    topic: "Idle donations",
    them: "Money sits in a bank account doing absolutely nothing",
    us: "Every USDC earns yield from the second it arrives",
  },
  {
    topic: "Failed campaigns",
    them: "Donors get their exact amount back. Nothing more.",
    us: "Donors get their principal back plus their yield share",
  },
  {
    topic: "Cross-border payouts",
    them: "5 to 7 business days, 3 to 5% lost to conversion",
    us: "One transaction, under a second, anywhere USDC is accepted",
  },
  {
    topic: "Gas token friction",
    them: "Not applicable (they use bank rails)",
    us: "USDC pays for gas. You never need another token.",
  },
  {
    topic: "Donor privacy",
    them: "Public donor lists are their product",
    us: "Optional anonymous contributions, no wallet linked",
  },
  {
    topic: "Platform fee",
    them: "2.9% of every donation plus payment processing",
    us: "1% of yield only. The principal is never touched.",
  },
];

export function WhyKova() {
  return (
    <section className="py-28 px-6" style={{ borderTop: "1px solid #2E2620" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <p
            className="text-xs uppercase tracking-[0.18em] mb-5"
            style={{ fontFamily: "Space Mono, monospace", color: "#7A7269" }}
          >
            Why Kova
          </p>
          <h2
            className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-5"
            style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE", maxWidth: "640px" }}
          >
            GoFundMe cannot build this. Structurally.
          </h2>
          <p className="text-lg leading-relaxed max-w-xl" style={{ color: "#B1ADA1" }}>
            These are not features they deprioritised. These are walls their architecture put up.
            Kova exists because programmable money changes what is actually possible.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #2E2620" }}>
          {/* Header row */}
          <div
            className="grid grid-cols-[1fr_1fr_1fr] gap-px"
            style={{ background: "#2E2620" }}
          >
            <div className="px-6 py-4" style={{ background: "#161210" }}>
              <span className="text-xs uppercase tracking-[0.15em]" style={{ fontFamily: "Space Mono, monospace", color: "#7A7269" }}>Topic</span>
            </div>
            <div className="px-6 py-4" style={{ background: "#161210" }}>
              <span className="text-xs uppercase tracking-[0.15em]" style={{ fontFamily: "Space Mono, monospace", color: "#7A7269" }}>GoFundMe</span>
            </div>
            <div className="px-6 py-4" style={{ background: "#161210" }}>
              <span className="text-xs uppercase tracking-[0.15em] font-bold" style={{ fontFamily: "Space Mono, monospace", color: "#C15F3C" }}>Kova</span>
            </div>
          </div>

          {/* Rows */}
          {compare.map(({ topic, them, us }, i) => (
            <div
              key={topic}
              className="grid grid-cols-[1fr_1fr_1fr] gap-px"
              style={{ background: "#2E2620" }}
            >
              <div
                className="px-6 py-5"
                style={{ background: i % 2 === 0 ? "#161210" : "#0E0B09" }}
              >
                <span className="text-sm font-semibold" style={{ color: "#F4F3EE", fontFamily: "Syne, sans-serif" }}>
                  {topic}
                </span>
              </div>
              <div
                className="px-6 py-5 flex items-start gap-2"
                style={{ background: i % 2 === 0 ? "#161210" : "#0E0B09" }}
              >
                <X size={14} className="mt-0.5 shrink-0" style={{ color: "#7A7269" }} />
                <span className="text-sm leading-relaxed" style={{ color: "#7A7269" }}>{them}</span>
              </div>
              <div
                className="px-6 py-5 flex items-start gap-2"
                style={{ background: i % 2 === 0 ? "#161210" : "#0E0B09" }}
              >
                <Check size={14} className="mt-0.5 shrink-0" style={{ color: "#C15F3C" }} />
                <span className="text-sm leading-relaxed" style={{ color: "#B1ADA1" }}>{us}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
