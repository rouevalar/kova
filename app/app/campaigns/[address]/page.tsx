import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CampaignDetail } from "@/components/campaign/CampaignDetail";

interface Props {
  params: Promise<{ address: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { address } = await params;
  return { title: `Campaign ${address.slice(0, 8)}... — Kova` };
}

export default async function CampaignPage({ params }: Props) {
  const { address } = await params;
  return (
    <div className="min-h-screen" style={{ background: "#0E0B09" }}>
      <Navbar />
      <main className="pt-[60px]">
        <CampaignDetail address={address} />
      </main>
      <Footer />
    </div>
  );
}
