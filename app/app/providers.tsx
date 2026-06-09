"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "react-hot-toast";

const arcTestnetChain = {
  id: 5042002,
  name: "Arc Testnet",
  network: "arc-testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
    public: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 10_000, refetchInterval: 15_000 } } })
  );

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#C15F3C",
          logo: "/logo.svg",
          landingHeader: "Connect to Kova",
          loginMessage: "Every dollar you contribute earns from the moment it arrives.",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        defaultChain: arcTestnetChain as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supportedChains: [arcTestnetChain as any],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1E1916",
              color: "#F4F3EE",
              border: "1px solid #2E2620",
              borderRadius: "12px",
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#C15F3C", secondary: "#1E1916" } },
            error: { iconTheme: { primary: "#EF4444", secondary: "#1E1916" } },
          }}
        />
      </QueryClientProvider>
    </PrivyProvider>
  );
}
