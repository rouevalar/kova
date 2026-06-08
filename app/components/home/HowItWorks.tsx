import { Wallet, TrendingUp, Send, RotateCcw } from "lucide-react";

const steps = [
  {
    icon: Wallet,
    number: "01",
    title: "Connect and create",
    body: "Link your wallet, describe your cause, set a goal and a deadline. Your campaign is a live smart contract on Arc in under two minutes. No application, no approval, no waiting.",
  },
  {
    icon: TrendingUp,
    number: "02",
    title: "Donations earn yield",
    body: "Every USDC that comes in goes straight into a yield vault. While your campaign runs, that money is working. Donors watch their contribution grow. You watch the total climb.",
  },
  {
    icon: Send,
    number: "03",
    title: "Withdraw more than you raised",
    body: "Hit your goal or cross the deadline and you pull everything in one transaction. Principal plus yield, minus a small fee taken only from the yield. You never touch the donated principal.",
  },
  {
    icon: RotateCcw,
    number: "04",
    title: "Donors get refunded with interest",
    body: "Campaign falls short? Every donor gets their money back plus their share of the yield the pool earned. They contributed for free and came out ahead. That has never existed before.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-28 px-6" style={{ borderTop: "1px solid #2E2620" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <p
            className="text-xs uppercase tracking-[0.18em] mb-5"
            style={{ fontFamily: "Space Mono, monospace", color: "#7A7269" }}
          >
            How it works
          </p>
          <h2
            className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-5"
            style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE", maxWidth: "600px" }}
          >
            Four steps. Then your money does the rest.
          </h2>
          <p className="text-lg leading-relaxed max-w-xl" style={{ color: "#B1ADA1" }}>
            We stripped out everything GoFundMe built their business model on. What remained was something cleaner.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ icon: Icon, number, title, body }) => (
            <div
              key={number}
              className="p-6 rounded-2xl"
              style={{ background: "#161210", border: "1px solid #2E2620" }}
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(193,95,60,0.1)" }}
                >
                  <Icon size={18} style={{ color: "#C15F3C" }} />
                </div>
                <span
                  className="text-xs font-bold"
                  style={{ fontFamily: "Space Mono, monospace", color: "#2E2620" }}
                >
                  {number}
                </span>
              </div>
              <h3
                className="font-bold text-base mb-3 leading-snug"
                style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}
              >
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#7A7269" }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
