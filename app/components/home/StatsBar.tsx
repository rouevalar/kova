import { neon } from "@neondatabase/serverless";

async function getStats() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const [row] = await sql`
      SELECT
        COUNT(*)::int AS campaign_count,
        COALESCE(SUM(total_raised), 0) AS total_raised,
        COALESCE(SUM(yield_earned), 0) AS total_yield,
        COALESCE(SUM(donor_count), 0) AS total_donors
      FROM campaigns
    `;
    return row;
  } catch {
    return { campaign_count: 0, total_raised: 0, total_yield: 0, total_donors: 0 };
  }
}

function fmt(val: number | string | bigint) {
  const n = Number(val) / 1_000_000;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export async function StatsBar() {
  const stats = await getStats();
  const items = [
    { label: "campaigns live", value: String(stats.campaign_count) },
    { label: "raised in USDC", value: fmt(stats.total_raised) },
    { label: "yield generated", value: fmt(stats.total_yield) },
    { label: "contributors", value: String(stats.total_donors) },
  ];

  return (
    <div
      className="py-6 px-6"
      style={{ borderTop: "1px solid #2E2620", borderBottom: "1px solid #2E2620", background: "#0E0B09" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div
                className="text-2xl font-bold tabular-nums mb-0.5"
                style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}
              >
                {value}
              </div>
              <div className="text-xs" style={{ color: "#7A7269", fontFamily: "Space Mono, monospace", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
