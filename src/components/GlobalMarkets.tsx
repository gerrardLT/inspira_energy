"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react";



const MARKETS = [
  {
    region: "Southeast Asia",
    status: "Active",
    projects: 12,
    capacity: "850 MW",
    description: "Vietnam, Thailand, Philippines — solar and storage deployment.",
    mapX: "73%", mapY: "52%",
  },
  {
    region: "Australia",
    status: "Active",
    projects: 5,
    capacity: "420 MW",
    description: "Large-scale solar and battery storage in Queensland and NSW.",
    mapX: "83%", mapY: "73%",
  },
  {
    region: "China",
    status: "Expanding",
    projects: 8,
    capacity: "1.2 GW",
    description: "Tier-1 developer partnerships on distributed solar and wind.",
    mapX: "76%", mapY: "38%",
  },
  {
    region: "Europe",
    status: "Pipeline",
    projects: 3,
    capacity: "280 MW",
    description: "Spain and Germany co-development partnerships.",
    mapX: "48%", mapY: "30%",
  },
];

/* Refined world map with smooth curves */
function WorldMap() {
  return (
    <svg viewBox="0 0 1000 500" className="w-full h-auto" fill="none">
      <defs>
        <linearGradient id="mapGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.06" />
          <stop offset="100%" stopColor="white" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* North America */}
      <path d="M130 130 C150 110 190 95 220 100 C250 105 270 120 280 145 C290 170 285 195 270 215 C255 235 230 240 210 235 C190 230 170 240 155 225 C140 210 125 185 120 165 C115 145 120 135 130 130Z" fill="url(#mapGrad)" stroke="white" strokeWidth="0.3" strokeOpacity="0.08" />
      {/* Central America */}
      <path d="M200 235 C210 240 215 250 210 260 C205 270 195 268 190 260 C185 252 190 240 200 235Z" fill="url(#mapGrad)" stroke="white" strokeWidth="0.3" strokeOpacity="0.06" />
      {/* South America */}
      <path d="M225 270 C240 265 260 270 275 285 C290 300 290 330 280 360 C270 390 255 405 240 400 C225 395 215 375 210 350 C205 325 210 295 215 280 C218 272 222 270 225 270Z" fill="url(#mapGrad)" stroke="white" strokeWidth="0.3" strokeOpacity="0.08" />
      {/* Europe */}
      <path d="M455 105 C470 95 490 90 505 95 C520 100 530 115 525 135 C520 155 510 165 495 168 C480 171 465 165 455 152 C445 139 445 120 455 105Z" fill="url(#mapGrad)" stroke="white" strokeWidth="0.3" strokeOpacity="0.08" />
      {/* UK/Ireland */}
      <path d="M440 110 C445 105 450 108 450 115 C450 122 445 125 440 120 C435 115 437 112 440 110Z" fill="url(#mapGrad)" stroke="white" strokeWidth="0.3" strokeOpacity="0.06" />
      {/* Africa */}
      <path d="M460 185 C475 178 500 175 520 185 C540 195 548 220 545 250 C542 280 530 310 515 335 C500 360 485 365 475 350 C465 335 455 305 450 275 C445 245 448 210 460 185Z" fill="url(#mapGrad)" stroke="white" strokeWidth="0.3" strokeOpacity="0.08" />
      {/* Middle East */}
      <path d="M540 155 C555 148 570 150 580 160 C590 170 588 185 578 195 C568 205 555 205 545 195 C535 185 535 165 540 155Z" fill="url(#mapGrad)" stroke="white" strokeWidth="0.3" strokeOpacity="0.06" />
      {/* Asia main */}
      <path d="M570 80 C600 72 650 68 700 75 C750 82 790 100 805 130 C820 160 810 190 790 210 C770 230 740 225 710 215 C680 205 650 190 625 175 C600 160 580 145 565 125 C555 110 558 90 570 80Z" fill="url(#mapGrad)" stroke="white" strokeWidth="0.3" strokeOpacity="0.08" />
      {/* India */}
      <path d="M640 190 C655 185 665 195 670 210 C675 225 670 245 660 255 C650 265 640 260 635 245 C630 230 632 200 640 190Z" fill="url(#mapGrad)" stroke="white" strokeWidth="0.3" strokeOpacity="0.06" />
      {/* Southeast Asia */}
      <path d="M730 225 C745 218 765 220 780 230 C795 240 800 258 790 272 C780 286 762 290 748 280 C734 270 725 248 730 225Z" fill="url(#mapGrad)" stroke="white" strokeWidth="0.3" strokeOpacity="0.08" />
      {/* Japan */}
      <path d="M815 120 C820 115 825 118 825 128 C825 138 820 148 815 145 C810 142 810 128 815 120Z" fill="url(#mapGrad)" stroke="white" strokeWidth="0.3" strokeOpacity="0.06" />
      {/* Australia */}
      <path d="M790 335 C810 325 840 320 865 330 C890 340 895 365 880 385 C865 405 840 410 815 400 C790 390 780 365 785 345 C787 338 789 336 790 335Z" fill="url(#mapGrad)" stroke="white" strokeWidth="0.3" strokeOpacity="0.08" />
      {/* New Zealand */}
      <path d="M910 395 C915 390 920 393 918 402 C916 411 910 415 908 408 C906 401 908 397 910 395Z" fill="url(#mapGrad)" stroke="white" strokeWidth="0.3" strokeOpacity="0.06" />
      {/* Meridian lines */}
      {[125, 250, 375].map(y => (
        <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="white" strokeWidth="0.2" strokeOpacity="0.04" strokeDasharray="2 6" />
      ))}
      {[250, 500, 750].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="500" stroke="white" strokeWidth="0.2" strokeOpacity="0.04" strokeDasharray="2 6" />
      ))}
      {/* Equator */}
      <line x1="0" y1="250" x2="1000" y2="250" stroke="white" strokeWidth="0.3" strokeOpacity="0.06" strokeDasharray="4 4" />
    </svg>
  );
}

export function GlobalMarkets() {
  return (
    <section id="markets" className="relative overflow-hidden navy-bg py-36 lg:py-48 noise-overlay">
      {/* Background decorative layers */}
      <div className="pointer-events-none absolute inset-0">
        {/* Radial glow - left */}
        <div className="absolute -left-40 top-1/3 h-[400px] w-[400px] rounded-full bg-teal/[0.04] blur-[100px]" />
        {/* Radial glow - right */}
        <div className="absolute -right-20 bottom-1/4 h-[300px] w-[300px] rounded-full bg-gold/[0.03] blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-16">
          {/* Left column */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-gold/60" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold">
                Global Reach
              </p>
            </div>
            <h2 className="mt-5 font-heading text-4xl leading-[1.08] tracking-[-0.02em] text-white md:text-5xl">
              Presence across{" "}
              <span
                className="italic"
                style={{
                  background: 'linear-gradient(135deg, var(--gold), oklch(0.80 0.10 85))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                }}
              >four continents</span>
            </h2>
            <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-white/40">
              From Southeast Asia to Europe, we operate a network of funds
              connecting developers with institutional capital.
            </p>

            {/* Big stats */}
            <div className="mt-14 space-y-8">
              <div className="border-l-2 border-gold/50 pl-6">
                <p className="font-heading text-5xl font-light tracking-[-0.02em] text-white">
                  2.7<span className="text-gold"> GW</span>
                </p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/30">
                  Total pipeline capacity
                </p>
              </div>
              <div className="border-l-2 border-gold/50 pl-6">
                <p className="font-heading text-5xl font-light tracking-[-0.02em] text-white">
                  28
                </p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/30">
                  Active projects worldwide
                </p>
              </div>
            </div>

            {/* Mini world map */}
            <div className="mt-14 relative">
              <WorldMap />
              {/* Map dots for each market */}
              {MARKETS.map((m) => (
                <motion.div
                  key={m.region}
                  className="absolute"
                  style={{ left: m.mapX, top: m.mapY }}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.0, delay: 0.5 }}
                >
                  <div className="relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_8px_oklch(0.70_0.12_78_/_50%)]" />
                    <motion.div
                      animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-gold/40"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Market cards */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            {MARKETS.map((market, i) => (
              <motion.div
                key={market.region}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 1.0,
                  delay: i * 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group relative flex items-start gap-6 border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.05]"
              >
                {/* Left metric */}
                <div className="min-w-[72px] pt-1">
                  <p className="font-heading text-3xl font-light tracking-[-0.02em] text-white">
                    {market.projects}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                    projects
                  </p>
                </div>

                {/* Center content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-white">
                      {market.region}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] ${
                        market.status === "Active"
                          ? "bg-teal/15 text-teal"
                          : market.status === "Expanding"
                          ? "bg-gold/15 text-gold"
                          : "bg-white/[0.08] text-white/40"
                      }`}
                    >
                      {market.status}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/35">
                    {market.description}
                  </p>
                </div>

                {/* Right metric */}
                <div className="text-right pt-1">
                  <p className="font-heading text-2xl font-light tracking-[-0.02em] text-white">
                    {market.capacity}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                    capacity
                  </p>
                </div>

                <div className="flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full border border-white/[0.06] transition-all duration-300 group-hover:border-gold/30 group-hover:bg-gold/5">
                  <ArrowUpRight className="h-3 w-3 text-white/15 transition-all group-hover:text-gold" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
