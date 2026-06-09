import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

// YIELD_RATE_PER_SECOND_1E18 from the contract (5% APY, scaled by 1e18)
const YIELD_RATE = BigInt("1585489599188");

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const rows = await sql`
      SELECT
        COALESCE(SUM(total_raised), 0)::text   AS total_raised,
        COALESCE(SUM(yield_earned), 0)::text   AS total_yield,
        COUNT(*)::int                           AS campaign_count,
        COALESCE(SUM(donor_count), 0)::int      AS total_donors,
        COALESCE(SUM(CASE WHEN NOT finalized THEN total_raised ELSE 0 END), 0)::text AS active_raised
      FROM campaigns
    `;
    const row = rows[0];

    // yield accruing per second across all active campaigns (in USDC micro-units)
    const activeRaised = BigInt(row.active_raised);
    // yieldPerSecondMicro = activeRaised * YIELD_RATE / 1e18
    const yieldPerSecondMicro = Number((activeRaised * YIELD_RATE) / BigInt("1000000000000000000"));

    return NextResponse.json({
      campaignCount: row.campaign_count,
      totalDonors: row.total_donors,
      totalRaised: row.total_raised,
      totalYield: row.total_yield,          // USDC micro-units (6 decimals)
      yieldPerSecond: yieldPerSecondMicro,  // micro-units per second
      timestamp: Date.now(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
