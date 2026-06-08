import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  bigint,
  real,
} from "drizzle-orm/pg-core";

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractAddress: text("contract_address").notNull().unique(),
  ownerAddress: text("owner_address").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull().default("general"),
  goal: bigint("goal", { mode: "bigint" }).notNull(),
  deadline: timestamp("deadline").notNull(),
  privateMode: boolean("private_mode").notNull().default(false),
  totalRaised: bigint("total_raised", { mode: "bigint" }).notNull().default(BigInt(0)),
  yieldEarned: bigint("yield_earned", { mode: "bigint" }).notNull().default(BigInt(0)),
  donorCount: integer("donor_count").notNull().default(0),
  finalized: boolean("finalized").notNull().default(false),
  goalReached: boolean("goal_reached").notNull().default(false),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contributions = pgTable("contributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaigns.id).notNull(),
  contractAddress: text("contract_address").notNull(),
  donorAddress: text("donor_address").notNull(),
  amount: bigint("amount", { mode: "bigint" }).notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  txHash: text("tx_hash").notNull(),
  blockNumber: bigint("block_number", { mode: "bigint" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  address: text("address").notNull().unique(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  totalDonated: bigint("total_donated", { mode: "bigint" }).notNull().default(BigInt(0)),
  campaignsCreated: integer("campaigns_created").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type Contribution = typeof contributions.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;
export type InsertContribution = typeof contributions.$inferInsert;
