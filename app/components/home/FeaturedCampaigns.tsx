import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { neon } from "@neondatabase/serverless";
import { CampaignCard } from "@/components/campaign/CampaignCard";

async function getFeatured() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT * FROM campaigns
      WHERE finalized = false
        AND deadline > NOW()
      ORDER BY total_raised DESC
      LIMIT 6
    `;
    return rows;
  } catch {
    return [];
  }
}

export async function FeaturedCampaigns() {
  const campaigns = await getFeatured();

  return (
    <section className="py-28 px-6" style={{ borderTop: "1px solid #2E2620" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p
              className="text-xs uppercase tracking-[0.18em] mb-5"
              style={{ fontFamily: "Space Mono, monospace", color: "#7A7269" }}
            >
              Live campaigns
            </p>
            <h2
              className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
              style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}
            >
              People raising right now
            </h2>
          </div>
          <Link
            href="/campaigns"
            className="hidden md:flex items-center gap-2 text-sm font-medium transition-all hover:gap-3"
            style={{ color: "#C15F3C" }}
          >
            See all <ArrowRight size={15} />
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 rounded-2xl"
            style={{ background: "#161210", border: "1px solid #2E2620" }}
          >
            <p className="text-lg font-semibold mb-2" style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}>
              No campaigns yet
            </p>
            <p className="text-sm mb-6" style={{ color: "#7A7269" }}>
              Be the first to start something here.
            </p>
            <Link
              href="/campaigns/new"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-95"
              style={{ background: "#C15F3C", color: "#F4F3EE" }}
            >
              Start a campaign
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c) => (
              <CampaignCard
                key={c.contract_address}
                contractAddress={c.contract_address}
                title={c.title}
                description={c.description}
                imageUrl={c.image_url}
                category={c.category}
                goal={c.goal?.toString() || "0"}
                totalRaised={c.total_raised?.toString() || "0"}
                yieldEarned={c.yield_earned?.toString() || "0"}
                deadline={c.deadline}
                privateMode={c.private_mode}
                finalized={c.finalized}
                donorCount={c.donor_count}
              />
            ))}
          </div>
        )}

        <div className="mt-8 flex md:hidden justify-center">
          <Link
            href="/campaigns"
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: "#C15F3C" }}
          >
            See all campaigns <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
