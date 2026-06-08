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
  const results = await publicClient.multicall({
    contracts: [
      { address, abi: CAMPAIGN_ABI, functionName: "owner" },
      { address, abi: CAMPAIGN_ABI, functionName: "title" },
      { address, abi: CAMPAIGN_ABI, functionName: "description" },
      { address, abi: CAMPAIGN_ABI, functionName: "imageUrl" },
      { address, abi: CAMPAIGN_ABI, functionName: "category" },
      { address, abi: CAMPAIGN_ABI, functionName: "goal" },
      { address, abi: CAMPAIGN_ABI, functionName: "deadline" },
      { address, abi: CAMPAIGN_ABI, functionName: "privateMode" },
      { address, abi: CAMPAIGN_ABI, functionName: "totalRaised" },
      { address, abi: CAMPAIGN_ABI, functionName: "yieldEarned" },
      { address, abi: CAMPAIGN_ABI, functionName: "finalized" },
      { address, abi: CAMPAIGN_ABI, functionName: "goalReached" },
      { address, abi: CAMPAIGN_ABI, functionName: "donorCount" },
      { address, abi: CAMPAIGN_ABI, functionName: "createdAt" },
    ],
    allowFailure: false,
  });

  return {
    owner: results[0] as `0x${string}`,
    title: results[1] as string,
    description: results[2] as string,
    imageUrl: results[3] as string,
    category: results[4] as string,
    goal: results[5] as bigint,
    deadline: results[6] as bigint,
    privateMode: results[7] as boolean,
    totalRaised: results[8] as bigint,
    yieldEarned: results[9] as bigint,
    finalized: results[10] as boolean,
    goalReached: results[11] as boolean,
    donorCount: results[12] as bigint,
    createdAt: results[13] as bigint,
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
