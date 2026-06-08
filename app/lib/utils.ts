import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function timeLeft(deadline: Date | number): string {
  const target = typeof deadline === "number" ? deadline * 1000 : deadline.getTime();
  const diff = target - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m left`;
}

export function progressPercent(raised: bigint, goal: bigint): number {
  if (goal === BigInt(0)) return 0;
  return Math.min(100, Number((raised * BigInt(100)) / goal));
}

export function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    medical: "Medical",
    education: "Education",
    emergency: "Emergency",
    community: "Community",
    legal: "Legal",
    creative: "Creative",
    general: "General",
  };
  return map[cat] || cat;
}
