import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedCampaigns } from "@/components/home/FeaturedCampaigns";
import { WhyKova } from "@/components/home/WhyKova";
import { StatsBar } from "@/components/home/StatsBar";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "#0E0B09" }}>
      <Navbar />
      <main className="pt-[60px]">
        <HeroSection />
        <StatsBar />
        <HowItWorks />
        <FeaturedCampaigns />
        <WhyKova />
      </main>
      <Footer />
    </div>
  );
}
