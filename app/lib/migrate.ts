import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contract_address TEXT NOT NULL UNIQUE,
      owner_address TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      category TEXT NOT NULL DEFAULT 'general',
      goal BIGINT NOT NULL,
      deadline TIMESTAMP NOT NULL,
      private_mode BOOLEAN NOT NULL DEFAULT false,
      total_raised BIGINT NOT NULL DEFAULT 0,
      yield_earned BIGINT NOT NULL DEFAULT 0,
      donor_count INTEGER NOT NULL DEFAULT 0,
      finalized BOOLEAN NOT NULL DEFAULT false,
      goal_reached BOOLEAN NOT NULL DEFAULT false,
      tx_hash TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS contributions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID REFERENCES campaigns(id),
      contract_address TEXT NOT NULL,
      donor_address TEXT NOT NULL,
      amount BIGINT NOT NULL,
      is_anonymous BOOLEAN NOT NULL DEFAULT false,
      tx_hash TEXT NOT NULL,
      block_number BIGINT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      address TEXT NOT NULL UNIQUE,
      display_name TEXT,
      bio TEXT,
      avatar_url TEXT,
      total_donated BIGINT NOT NULL DEFAULT 0,
      campaigns_created INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log("Migration complete");
}

migrate().catch(console.error);
