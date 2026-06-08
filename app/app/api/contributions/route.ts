import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const donor = searchParams.get("donor");
  const campaign = searchParams.get("campaign");

  try {
    let rows;
    if (donor) {
      rows = await sql`
        SELECT c.*, camp.title AS campaign_title, camp.yield_earned
        FROM contributions c
        LEFT JOIN campaigns camp ON camp.contract_address = c.contract_address
        WHERE c.donor_address = ${donor.toLowerCase()}
        ORDER BY c.created_at DESC
      `;
    } else if (campaign) {
      rows = await sql`
        SELECT * FROM contributions
        WHERE contract_address = ${campaign.toLowerCase()}
        ORDER BY created_at DESC
      `;
    } else {
      rows = await sql`SELECT * FROM contributions ORDER BY created_at DESC LIMIT 50`;
    }
    return NextResponse.json({ contributions: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractAddress, donorAddress, amount, isAnonymous, txHash, blockNumber } = body;

    if (!contractAddress || !donorAddress || !amount || !txHash) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get campaign id
    const [camp] = await sql`
      SELECT id FROM campaigns WHERE contract_address = ${contractAddress.toLowerCase()}
    `;

    const [row] = await sql`
      INSERT INTO contributions (campaign_id, contract_address, donor_address, amount, is_anonymous, tx_hash, block_number)
      VALUES (
        ${camp?.id ?? null},
        ${contractAddress.toLowerCase()},
        ${donorAddress.toLowerCase()},
        ${amount.toString()},
        ${isAnonymous || false},
        ${txHash},
        ${blockNumber?.toString() ?? null}
      )
      ON CONFLICT DO NOTHING
      RETURNING *
    `;

    // Update campaign donor count and total raised
    await sql`
      UPDATE campaigns SET
        total_raised = total_raised + ${amount.toString()}::bigint,
        donor_count  = donor_count + 1,
        updated_at   = NOW()
      WHERE contract_address = ${contractAddress.toLowerCase()}
    `;

    return NextResponse.json({ contribution: row }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
