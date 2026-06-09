import { createPublicClient, createWalletClient, http, defineChain, parseAbi } from "viem";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
      webSocket: ["wss://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as `0x${string}`;
export const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0x85cFf3D00c2e3c4665671FC43BbCE121451f0c59") as `0x${string}`;

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http("https://rpc.testnet.arc.network"),
});

export const FACTORY_ABI = parseAbi([
  "function createCampaign(string title, string description, string imageUrl, string category, uint256 goal, uint256 deadline, bool privateMode) external returns (address campaign)",
  "function getCampaignCount() external view returns (uint256)",
  "function getCampaigns(uint256 offset, uint256 limit) external view returns (address[])",
  "function getMyCampaigns(address user) external view returns (address[])",
  "function allCampaigns(uint256) external view returns (address)",
  "event CampaignCreated(address indexed campaign, address indexed owner, string title, uint256 goal, uint256 deadline, bool privateMode)",
]);

export const CAMPAIGN_ABI = parseAbi([
  "function contribute(uint256 amount, bool isAnonymous) external",
  "function finalize() external",
  "function updateMeta(string description, string imageUrl) external",
  "function owner() external view returns (address)",
  "function title() external view returns (string)",
  "function description() external view returns (string)",
  "function imageUrl() external view returns (string)",
  "function category() external view returns (string)",
  "function goal() external view returns (uint256)",
  "function deadline() external view returns (uint256)",
  "function privateMode() external view returns (bool)",
  "function totalRaised() external view returns (uint256)",
  "function createdAt() external view returns (uint256)",
  "function finalized() external view returns (bool)",
  "function goalReached() external view returns (bool)",
  "function yieldEarned() external view returns (uint256)",
  "function totalWithYield() external view returns (uint256)",
  "function donorCount() external view returns (uint256)",
  "function contributions(address) external view returns (uint256)",
  "function donorYieldShare(address) external view returns (uint256)",
  "function getDonors() external view returns (address[], uint256[])",
  "function isPrivateDonor(address) external view returns (bool)",
  "event Contributed(address indexed donor, uint256 amount, bool isAnonymous)",
  "event Finalized(bool goalReached, uint256 totalRaised, uint256 yieldEarned, uint256 fee)",
  "event Refunded(address indexed donor, uint256 principal, uint256 yieldShare)",
]);

export const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
]);

export async function getCampaignData(address: `0x${string}`) {
  // Use individual eth_call via Promise.all — avoids Multicall3 dependency
  const r = (fn: string) => publicClient.readContract({ address, abi: CAMPAIGN_ABI, functionName: fn as never });

  const [
    owner, title, description, imageUrl, category, goal, deadline,
    privateMode, totalRaised, yieldEarned, finalized, goalReached, donorCount, createdAt,
  ] = await Promise.all([
    r("owner"), r("title"), r("description"), r("imageUrl"), r("category"),
    r("goal"), r("deadline"), r("privateMode"), r("totalRaised"), r("yieldEarned"),
    r("finalized"), r("goalReached"), r("donorCount"), r("createdAt"),
  ]);

  return {
    owner: owner as `0x${string}`,
    title: title as string,
    description: description as string,
    imageUrl: imageUrl as string,
    category: category as string,
    goal: goal as bigint,
    deadline: deadline as bigint,
    privateMode: privateMode as boolean,
    totalRaised: totalRaised as bigint,
    yieldEarned: yieldEarned as bigint,
    finalized: finalized as boolean,
    goalReached: goalReached as boolean,
    donorCount: donorCount as bigint,
    createdAt: createdAt as bigint,
    contractAddress: address,
  };
}

export function formatUsdc(amount: bigint, decimals = 2): string {
  const value = Number(amount) / 1_000_000;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function parseUsdc(amount: string): bigint {
  const value = parseFloat(amount);
  return BigInt(Math.round(value * 1_000_000));
}
