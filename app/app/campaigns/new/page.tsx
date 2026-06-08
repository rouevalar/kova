import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CreateCampaignForm } from "@/components/campaign/CreateCampaignForm";

export const metadata = {
  title: "Start a Campaign — Kova",
};

export default function NewCampaignPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0E0B09" }}>
      <Navbar />
      <main className="pt-[60px]">
        <CreateCampaignForm />
      </main>
      <Footer />
    </div>
  );
}
