import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto py-12 px-6" style={{ borderTop: "1px solid #2E2620" }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="Kova" width={26} height={26} />
          <span
            style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#F4F3EE", letterSpacing: "-0.03em" }}
          >
            kova
          </span>
        </Link>

        <div className="flex flex-wrap gap-6 text-sm" style={{ color: "#7A7269" }}>
          <Link href="/campaigns" className="hover:text-[#B1ADA1] transition-colors">Browse</Link>
          <Link href="/campaigns/new" className="hover:text-[#B1ADA1] transition-colors">Start a campaign</Link>
          <Link href="/dashboard" className="hover:text-[#B1ADA1] transition-colors">Dashboard</Link>
          <a
            href="https://testnet.arcscan.app/address/0x85cFf3D00c2e3c4665671FC43BbCE121451f0c59"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[#B1ADA1] transition-colors"
          >
            Contract <ExternalLink size={11} />
          </a>
        </div>

        <p className="text-xs" style={{ color: "#7A7269" }}>
          Built on Arc. Every dollar earns while it waits.
        </p>
      </div>
    </footer>
  );
}
