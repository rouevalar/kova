"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/Button";
import { LiveYieldTicker } from "@/components/home/LiveYieldTicker";

export function HeroSection() {
  const { authenticated, login } = usePrivy();

  return (
    <section
      className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden"
      style={{ paddingTop: "80px", paddingBottom: "80px" }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(193,95,60,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Arc badge */}
      <div
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-10 fade-up"
        style={{ background: "rgba(193,95,60,0.1)", border: "1px solid rgba(193,95,60,0.25)", color: "#C15F3C" }}
      >
        <Zap size={11} />
        Built on Arc. Every donation earns the second it lands.
      </div>

      {/* Headline */}
      <h1
        className="fade-up text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-none mb-6"
        style={{
          fontFamily: "Syne, sans-serif",
          color: "#F4F3EE",
          animationDelay: "0.05s",
          maxWidth: "1000px",
        }}
      >
        Fundraising where
        <br />
        <span style={{ color: "#C15F3C" }}>every dollar works.</span>
      </h1>

      <p
        className="fade-up text-lg md:text-xl leading-relaxed mb-10 max-w-2xl"
        style={{ color: "#B1ADA1", animationDelay: "0.1s" }}
      >
        Your donation goes straight into a yield vault the moment it arrives.
        No idle money. No middleman. By the time the campaign closes,
        the beneficiary receives more than you gave.
      </p>

      {/* CTAs */}
      <div className="fade-up flex flex-col sm:flex-row gap-3 mb-16" style={{ animationDelay: "0.15s" }}>
        {authenticated ? (
          <Link href="/campaigns/new">
            <Button variant="primary" size="lg" className="gap-2">
              Start a campaign <ArrowRight size={16} />
            </Button>
          </Link>
        ) : (
          <Button variant="primary" size="lg" onClick={() => login()} className="gap-2">
            Start a campaign <ArrowRight size={16} />
          </Button>
        )}
        <Link href="/campaigns">
          <Button variant="secondary" size="lg">
            See what people are raising for
          </Button>
        </Link>
      </div>

      {/* Live yield ticker */}
      <div className="fade-up" style={{ animationDelay: "0.2s" }}>
        <LiveYieldTicker />
      </div>
    </section>
  );
}
