import LandingSection from "@/components/sections/Home/LandingSection/LandingSection";
import DescSection from "@/components/sections/Home/DescSection/DescSection";
import InfoSection from "@/components/sections/Home/InfoSection/InfoSection";
import "./globals.scss";
import WorkSection from "@/components/sections/Home/WorkSection/WorkSection";

export default function Home() {
  return (
    <>
      <LandingSection />
      <InfoSection />
      <DescSection />
      <WorkSection />
    </>
  );
}
