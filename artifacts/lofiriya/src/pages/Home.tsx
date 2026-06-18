import { HeroSection } from '@/components/home/HeroSection';
import { StatsSection } from '@/components/home/StatsSection';
import { PlatformsSection } from '@/components/home/PlatformsSection';
import { WhySection } from '@/components/home/WhySection';
import { FeaturesShowcase } from '@/components/home/FeaturesShowcase';
import { CommandDemo } from '@/components/home/CommandDemo';
import { PremiumShowcase } from '@/components/home/PremiumShowcase';
import { Testimonials } from '@/components/home/Testimonials';
import { FAQSection } from '@/components/home/FAQSection';
import { CTASection } from '@/components/home/CTASection';

export default function Home() {
  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      <HeroSection />
      <StatsSection />
      <PlatformsSection />
      <WhySection />
      <FeaturesShowcase />
      <CommandDemo />
      <PremiumShowcase />
      <Testimonials />
      <FAQSection />
      <CTASection />
    </div>
  );
}
