import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { FundCards } from "@/components/FundCards";
import { GlobalMarkets } from "@/components/GlobalMarkets";
import { AboutTeam } from "@/components/AboutTeam";
import { ForDevelopers } from "@/components/ForDevelopers";
import { Insights } from "@/components/Insights";
import { Footer } from "@/components/Footer";
import { DarkToLight, LightToDark, DarkSeparator } from "@/components/SectionTransitions";

/**
 * Capital Clarity — Page Composition
 *
 * Design philosophy: Precision + Signal + Trust
 *
 * The page is predominantly dark (navy) to convey institutional authority.
 * Only AboutTeam breaks to light — the single "human" moment.
 * Transitions are minimal (40-64px gradients), never the star of the show.
 *
 * Layout:
 *   Hero          (dark)  — Full viewport, dramatic opening
 *   FundCards     (dark)  — Core product showcase, data-dense
 *   GlobalMarkets (dark)  — World view, the most expansive section
 *   DarkSeparator         — Subtle tonal shift (24-32px)
 *   ForDevelopers (dark)  — Action-oriented, focused
 *   DarkToLight           — Gradient fade (48-64px)
 *   AboutTeam     (light) — The one warm, human moment
 *   LightToDark           — Gradient fade (48-64px)
 *   Insights      (dark)  — Knowledge, contemplative
 *   Footer        (dark)  — Closing
 */
export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <FundCards />
        <GlobalMarkets />
        <DarkSeparator />
        <ForDevelopers />
        <DarkToLight />
        <AboutTeam />
        <LightToDark />
        <Insights />
      </main>
      <Footer />
    </>
  );
}
