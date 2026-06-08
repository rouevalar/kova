import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CampaignsBrowser } from "@/components/campaign/CampaignsBrowser";

export const metadata = {
  title: "Browse Campaigns — Kova",
};

export default function CampaignsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0E0B09" }}>
      <Navbar />
      <main className="pt-[60px]">
        <CampaignsBrowser />
      </main>
      <Footer />
    </div>
  );
}
