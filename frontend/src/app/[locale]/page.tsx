import { Navbar } from "@/src/components/landing/Navbar";
import { HeroSection } from "@/src/components/landing/HeroSection";
import { HowItWorksSection } from "@/src/components/landing/HowItWorksSection";
import { FleetSection } from "@/src/components/landing/FleetSection";
import { PackagesSection } from "@/src/components/landing/PackagesSection";
import { FeaturesSection } from "@/src/components/landing/FeaturesSection";
import { Footer } from "@/src/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="bg-[#0A0A0A] min-h-screen">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <FleetSection />
      <PackagesSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
}
