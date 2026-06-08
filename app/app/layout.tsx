import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Kova — Fundraising Where Every Dollar Works",
  description: "Raise money that earns while you raise. Every USDC contribution goes straight into a yield vault. Donors give more than they donated.",
  openGraph: {
    title: "Kova — Fundraising Where Every Dollar Works",
    description: "Fundraising built on Arc. Every donation earns yield from the second it arrives.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
