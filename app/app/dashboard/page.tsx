import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const metadata = {
  title: "Dashboard — Kova",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0E0B09" }}>
      <Navbar />
      <main className="pt-[60px]">
        <Dashboard />
      </main>
      <Footer />
    </div>
  );
}
