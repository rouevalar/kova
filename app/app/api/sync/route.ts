import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";
import { publicClient, FACTORY_ADDRESS, FACTORY_ABI, getCampaignData } from "@/lib/arc";

const sql = neon(process.env.DATABASE_URL!);

// This endpoint syncs on-chain campaign state to the DB
// Call it via a cron job or after relevant transactions
export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json().catch(() => ({}));

    if (address) {
      // Sync single campaign
      const data = await getCampaignData(address as `0x${string}`);
      await sql`
        UPDATE campaigns SET
          total_raised = ${data.totalRaised.toString()},
          yield_earned = ${data.yieldEarned.toString()},
          donor_count  = ${Number(data.donorCount)},
          finalized    = ${data.finalized},
          goal_reached = ${data.goalReached},
          updated_at   = NOW()
        WHERE contract_address = ${address.toLowerCase()}
      `;
      return NextResponse.json({ synced: 1 });
    }

    // Sync all campaigns from factory
    const count = await publicClient.readContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "getCampaignCount",
    }) as bigint;

    const addresses = await publicClient.readContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "getCampaigns",
      args: [BigInt(0), count],
    }) as `0x${string}`[];

    let synced = 0;
    for (const addr of addresses) {
      try {
        const data = await getCampaignData(addr);
        const existing = await sql`SELECT id FROM campaigns WHERE contract_address = ${addr.toLowerCase()}`;
        if (existing.length > 0) {
          await sql`
            UPDATE campaigns SET
              total_raised = ${data.totalRaised.toString()},
              yield_earned = ${data.yieldEarned.toString()},
              donor_count  = ${Number(data.donorCount)},
              finalized    = ${data.finalized},
              goal_reached = ${data.goalReached},
              updated_at   = NOW()
            WHERE contract_address = ${addr.toLowerCase()}
          `;
        }
        synced++;
      } catch (err) {
        console.error(`Failed to sync ${addr}:`, err);
      }
    }

    return NextResponse.json({ synced, total: addresses.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
