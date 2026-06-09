import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  try {
    const [user] = await sql`
      SELECT u.*,
        (SELECT COALESCE(SUM(c.total_raised), 0) FROM campaigns c WHERE c.owner_address = u.address)::bigint AS owner_total_raised
      FROM users u
      WHERE u.address = ${address.toLowerCase()}
    `;
    return NextResponse.json({ user: user ?? null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, displayName, bio, avatarUrl, accountType } = body;

    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    const [user] = await sql`
      INSERT INTO users (address, display_name, bio, avatar_url, account_type)
      VALUES (
        ${address.toLowerCase()},
        ${displayName || null},
        ${bio || null},
        ${avatarUrl || null},
        ${accountType || "individual"}
      )
      ON CONFLICT (address) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        bio          = EXCLUDED.bio,
        avatar_url   = EXCLUDED.avatar_url,
        account_type = EXCLUDED.account_type,
        updated_at   = NOW()
      RETURNING *
    `;

    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
