# Kova

Fundraising where every dollar works.

The name comes from the Swahili word for "to gather." That is exactly what Kova does. It gathers contributions from many people, puts them to work while the campaign runs, and delivers more to the beneficiary than was ever donated.

## The problem with every other fundraising platform

GoFundMe raised $4 billion last year. Not a dollar of it earned anything. Every contribution sat in a bank account doing nothing from the moment it was donated until the campaign paid out. The donor gave everything they could. The beneficiary got exactly that. The platform took 2.9% plus processing fees.

Kova works differently because it runs on Arc, and Arc makes money programmable in ways that traditional payment rails cannot replicate.

## How it works

**Creating a campaign** takes under two minutes. Connect a wallet, fill in a title, goal, deadline, category, and an optional banner image. The campaign deploys as a smart contract on Arc Testnet. Every new campaign is automatically seeded with 1 USDC from the factory's yield reserve so that simulated yield payouts are backed by real USDC at finalization.

**Contributions earn yield** from the second they arrive. The campaign page shows two numbers updating in real time: the amount raised and the yield earned on top of it. A campaign targeting $10,000 that fills over 30 days might close at $10,340.

**Failed campaigns refund with interest.** If the goal is not reached, every donor gets their principal back plus their proportional share of whatever the pool earned. This has never existed in fundraising before.

**Withdrawals are instant.** One transaction, under a second, anywhere USDC is accepted. No bank transfer. No waiting five days. No country restrictions.

**Privacy is real.** Donors can contribute without their wallet address appearing in the donor list. The campaign owner sees the total. The individual is not exposed.

**The fee.** Kova charges 1% of the yield earned, not of the principal donated. If a campaign raises $10,000 and earns $340 in yield, Kova takes $3.40. The donor's contribution is never touched.

## Stack

**Contracts** — Solidity 0.8.24, deployed with Foundry on Arc Testnet (chain ID 5042002)

**Frontend** — Next.js 16 App Router, Tailwind v4, TypeScript

**Auth** — Privy (wallet only login, embedded wallets for new users)

**Database** — Neon PostgreSQL (campaign metadata, contribution history, user profiles)

**Storage** — Vercel Blob (campaign banner images, profile photos)

**Chain** — Arc Testnet, USDC as native gas token (6 decimals)

## Live app

https://kova-fundraising.vercel.app

## Deployed contracts

| Contract    | Address                                      |
|-------------|----------------------------------------------|
| KovaFactory | `0x7B12E5Bcd44eE9A7713C4D57D336766110938077` |

Explorer: https://testnet.arcscan.app/address/0x7B12E5Bcd44eE9A7713C4D57D336766110938077

The factory holds a 25 USDC yield reserve. Each campaign created receives 1 USDC from this reserve at deployment time to back real yield payouts at finalization.

## Running locally

```bash
cd app && npm install

# Copy env and fill in values
cp .env.local.example .env.local

# Run database migrations (creates campaigns, contributions, users tables)
npx tsx lib/migrate.ts

# Start dev server
npm run dev
```

## Environment variables

```
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=
DATABASE_URL=
BLOB_READ_WRITE_TOKEN=
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_FACTORY_ADDRESS=0x7B12E5Bcd44eE9A7713C4D57D336766110938077
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

After deploying, fund the factory's yield reserve:

```bash
# Approve the factory to pull USDC from your wallet
cast send 0x3600000000000000000000000000000000000000 \
  "approve(address,uint256)" <factory-address> <amount-in-micro-usdc> \
  --rpc-url https://rpc.testnet.arc.network --private-key $DEPLOYER_PK --legacy

# Deposit into the reserve
cast send <factory-address> \
  "depositReserve(uint256)" <amount-in-micro-usdc> \
  --rpc-url https://rpc.testnet.arc.network --private-key $DEPLOYER_PK --legacy
```

Your deployer wallet needs testnet USDC for gas and the reserve deposit. Get it at https://faucet.circle.com — select Arc Testnet.

## How yield works

Yield is simulated at 5% APY inside the contract using a constant rate of `1585489599188` per USDC unit per second (scaled by 1e18). The `yieldEarned()` view computes `totalRaised × rate × timeElapsed / 1e18` on every call. No external protocol is involved on testnet. The factory's yield reserve ensures that when a campaign finalizes, the simulated yield number is backed by actual USDC in the contract.

On a production network this would be replaced with a real vault integration — depositing contributions into USYC or a similar instrument and withdrawing actual earned interest at finalization.

## Why Arc

USDC is the native gas token. Contributors pay fees in the same token they are donating in. There is no "you need ETH to donate USDC" problem. A first-time user can contribute immediately.

Finality in under a second. The campaign dashboard updates the moment a transaction is confirmed. There is no waiting for block confirmations.

Built on Arc Testnet. Every dollar earns while it waits.
