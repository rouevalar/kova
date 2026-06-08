import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  try {
    const [row] = await sql`
      SELECT * FROM campaigns WHERE contract_address = ${address.toLowerCase()}
    `;
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ campaign: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  try {
    const body = await req.json();
    const { totalRaised, yieldEarned, donorCount, finalized, goalReached } = body;

    const [row] = await sql`
      UPDATE campaigns SET
        total_raised = COALESCE(${totalRaised?.toString() ?? null}::bigint, total_raised),
        yield_earned = COALESCE(${yieldEarned?.toString() ?? null}::bigint, yield_earned),
        donor_count  = COALESCE(${donorCount ?? null}::int, donor_count),
        finalized    = COALESCE(${finalized ?? null}::boolean, finalized),
        goal_reached = COALESCE(${goalReached ?? null}::boolean, goal_reached),
        updated_at   = NOW()
      WHERE contract_address = ${address.toLowerCase()}
      RETURNING *
    `;
    return NextResponse.json({ campaign: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
