import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const owner = searchParams.get("owner");
  const finalized = searchParams.get("finalized");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    let rows;
    if (owner) {
      rows = await sql`
        SELECT * FROM campaigns
        WHERE owner_address = ${owner.toLowerCase()}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (category && category !== "all") {
      rows = await sql`
        SELECT * FROM campaigns
        WHERE category = ${category}
        AND (${finalized === null} OR finalized = ${finalized === "true"})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      rows = await sql`
        SELECT * FROM campaigns
        WHERE (${finalized === null} OR finalized = ${finalized === "true"})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    return NextResponse.json({ campaigns: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contractAddress,
      ownerAddress,
      title,
      description,
      imageUrl,
      category,
      goal,
      deadline,
      privateMode,
      txHash,
    } = body;

    if (!contractAddress || !ownerAddress || !title || !goal || !deadline) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [row] = await sql`
      INSERT INTO campaigns (
        contract_address, owner_address, title, description, image_url,
        category, goal, deadline, private_mode, tx_hash
      ) VALUES (
        ${contractAddress.toLowerCase()},
        ${ownerAddress.toLowerCase()},
        ${title},
        ${description || ""},
        ${imageUrl || null},
        ${category || "general"},
        ${goal.toString()},
        ${new Date(deadline * 1000).toISOString()},
        ${privateMode || false},
        ${txHash || null}
      )
      ON CONFLICT (contract_address) DO NOTHING
      RETURNING *
    `;

    return NextResponse.json({ campaign: row }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create campaign record" }, { status: 500 });
  }
}
