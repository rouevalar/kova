"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Plus } from "lucide-react";
import { cn, shortenAddress } from "@/lib/utils";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

export function Navbar() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const checkedRef = useRef(false);
  const address = user?.wallet?.address;

  const links = [
    { href: "/campaigns", label: "Browse" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  // Check if this is a first-time user after wallet connects
  useEffect(() => {
    if (!ready || !authenticated || !address || checkedRef.current) return;
    checkedRef.current = true;

    fetch(`/api/users?address=${encodeURIComponent(address)}`)
      .then(r => r.json())
      .then(data => {
        if (!data.user) {
          setShowOnboarding(true);
        }
      })
      .catch(() => {/* non-blocking */});
  }, [ready, authenticated, address]);

  // Reset checker when user disconnects
  useEffect(() => {
    if (!authenticated) checkedRef.current = false;
  }, [authenticated]);

  return (
    <>
      {showOnboarding && address && (
        <OnboardingModal
          walletAddress={address}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "rgba(14, 11, 9, 0.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid #2E2620",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <Image
              src="/logo.svg"
              alt="Kova"
              width={28}
              height={28}
              className="transition-transform duration-300 group-hover:scale-110"
            />
            <span
              className="tracking-[-0.03em]"
              style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "#F4F3EE" }}
            >
              kova
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname.startsWith(href)
                    ? "text-[#F4F3EE] bg-[#1E1916]"
                    : "text-[#B1ADA1] hover:text-[#F4F3EE] hover:bg-[#1E1916]"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {authenticated && (
              <Link
                href="/campaigns/new"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-95 active:scale-90"
                style={{ background: "#C15F3C", color: "#F4F3EE" }}
              >
                <Plus size={15} strokeWidth={2.5} />
                Start a campaign
              </Link>
            )}
            {ready && (
              authenticated ? (
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-95"
                  style={{ border: "1px solid #2E2620", color: "#B1ADA1", background: "transparent" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#C15F3C" }} />
                  {address ? shortenAddress(address) : "Connected"}
                </button>
              ) : (
                <button
                  onClick={() => login()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-95"
                  style={{ border: "1px solid #C15F3C", color: "#C15F3C", background: "transparent" }}
                >
                  Connect wallet
                </button>
              )
            )}
          </div>

          <button
            className="md:hidden transition-colors"
            style={{ color: "#B1ADA1" }}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden px-6 pb-5 pt-2 space-y-1" style={{ borderTop: "1px solid #2E2620" }}>
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  pathname.startsWith(href) ? "text-[#F4F3EE] bg-[#1E1916]" : "text-[#B1ADA1]"
                )}
              >
                {label}
              </Link>
            ))}
            <div className="pt-2">
              {ready && (
                authenticated ? (
                  <button
                    onClick={() => { logout(); setOpen(false); }}
                    className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-[#B1ADA1]"
                  >
                    Disconnect · {address ? shortenAddress(address) : ""}
                  </button>
                ) : (
                  <button
                    onClick={() => { login(); setOpen(false); }}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-center"
                    style={{ background: "#C15F3C", color: "#F4F3EE" }}
                  >
                    Connect wallet
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
