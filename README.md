# Kova

Fundraising where every dollar works.

The name comes from the Swahili word for "to gather." That is exactly what Kova does. It gathers contributions from many people, puts them to work while the campaign runs, and delivers more to the beneficiary than was ever donated.

## The problem with every other fundraising platform

GoFundMe raised $4 billion last year. Not a dollar of it earned anything. Every contribution sat in a bank account doing nothing from the moment it was donated until the campaign paid out. The donor gave everything they could. The beneficiary got exactly that. The platform took 2.9% plus processing fees.

Kova works differently because it runs on Arc, and Arc makes money programmable in ways that traditional payment rails cannot replicate.

## How it works

**Creating a campaign** takes under two minutes. Connect a wallet, set a title, a goal in USDC, a deadline, and whether you want donor privacy. That is it. The campaign deploys as a smart contract on Arc.

**Contributions earn yield** from the second they arrive. Every USDC donated goes into a yield vault. The campaign dashboard shows two numbers updating in real time: the amount raised and the yield earned on top of it. A campaign targeting $10,000 that fills over 30 days might close at $10,340.

**Failed campaigns refund with interest.** If the goal is not reached, every donor gets their principal back plus their proportional share of whatever the pool earned. This has never existed in fundraising before.

**Withdrawals are instant.** One transaction, under a second, anywhere USDC is accepted. No bank transfer. No 5-day wait. No country restrictions.

**Privacy is real.** Donors can contribute without their wallet address appearing in the donor list. The campaign owner sees the total. The individual is not exposed. GoFundMe cannot offer this because their business model depends on public donor lists driving social proof.

**The fee.** Kova charges 1% of the yield earned, not of the principal donated. If a campaign raises $10,000 and earns $340 in yield, Kova takes $3.40. The donor's contribution is never touched.

## Stack

**Contracts** — Solidity 0.8.24, deployed with Foundry on Arc Testnet (chain ID 5042002)

**Frontend** — Next.js 15 App Router, Tailwind v4, TypeScript

**Auth** — Privy (embedded wallets, email login, injected wallet support)

**Database** — Neon PostgreSQL (campaign metadata, contribution history)

**Chain** — Arc Testnet, USDC as native gas token

## Deployed contracts

| Contract     | Address |
|--------------|---------|
| KovaFactory  | `0x85cFf3D00c2e3c4665671FC43BbCE121451f0c59` |

Explorer: https://testnet.arcscan.app/address/0x85cFf3D00c2e3c4665671FC43BbCE121451f0c59

## Running locally

```bash
# Install app dependencies
cd app && npm install

# Copy the env template and fill in your values
cp .env.local.example .env.local

# Run database migrations
npx tsx lib/migrate.ts

# Start the dev server
npm run dev
```

## Environment variables

```
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=
DATABASE_URL=
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_FACTORY_ADDRESS=0x85cFf3D00c2e3c4665671FC43BbCE121451f0c59
NEXT_PUBLIC_EXPLORER_URL=https://testnet.arcscan.app
```

## Deploying contracts

```bash
cd contracts
DEPLOYER_PK=<your-private-key> forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc.testnet.arc.network \
  --broadcast \
  --legacy
```

Your deployer wallet needs testnet USDC for gas. Get it at https://faucet.circle.com — select Arc Testnet.

## Why Arc

Three things make this possible on Arc that are not possible elsewhere right now.

USDC is the native gas token. Contributors pay fees in the same token they are donating in. There is no "you need ETH to donate USDC" problem. A first-time user can contribute immediately.

Sub-second finality. The campaign dashboard updates the moment a transaction is confirmed. There is no waiting for block confirmations. The experience feels like paying for coffee, not settling a financial instrument.

USYC on Arc. The yield vault is backed by US Treasury securities through Circle's USYC token. It is not speculative farm emissions. It is real, low-risk yield that happens to be on-chain.

---

Built on Arc Testnet. Every dollar earns while it waits.
