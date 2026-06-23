import { Hero } from "@/components/Hero";
import { SocialProof } from "@/components/SocialProof";
import { HomepageFundsTeaser } from "@/components/HomepageFundsTeaser";
import { HomepageMarketsTeaser } from "@/components/HomepageMarketsTeaser";
import { HomepageCTA } from "@/components/HomepageCTA";

/**
 * Homepage — Magazine Cover / Editorial Opener
 *
 * Flow:
 *   Hero                — Cinematic opener, full-bleed video + headline + stats
 *   SocialProof         — Press mentions + testimonial quotes
 *   HomepageFundsTeaser — 4 mini fund cards + link to /funds
 *   HomepageMarketsTeaser — 4 regions preview + link to /markets
 *   HomepageCTA         — Dual entry: Investor / Developer
 */
export default function Home() {
  return (
    <>
      <Hero />
      <SocialProof />
      <HomepageFundsTeaser />
      <HomepageMarketsTeaser />
      <HomepageCTA />
    </>
  );
}
