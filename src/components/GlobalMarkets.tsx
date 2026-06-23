"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, animate } from "motion/react";
import { Globe3D } from "./Globe3D";

/* Animated counter for big stats */
function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;
    const controls = animate(0, target, {
      duration: 2.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setCount(Math.round(v * 10) / 10),
    });
    return () => controls.stop();
  }, [inView, target]);

  return (
    <span ref={ref}>
      {prefix}{count % 1 === 0 ? count : count.toFixed(1)}{suffix}
    </span>
  );
}

const MARKETS = [
  {
    region: "Southeast Asia",
    capacity: "850 MW",
    description:
      "Vietnam, Thailand, Philippines — our most established market with 12 active projects spanning solar deployment and battery storage integration across rapidly growing economies.",
  },
  {
    region: "China",
    capacity: "1.2 GW",
    description:
      "Tier-1 developer partnerships on distributed solar and wind, leveraging deep local networks to connect Chinese project sponsors with international institutional capital.",
  },
  {
    region: "Australia",
    capacity: "420 MW",
    description:
      "Large-scale solar and battery storage in Queensland and NSW, targeting the growing demand for firm capacity in the National Electricity Market.",
  },
  {
    region: "Europe",
    capacity: "280 MW",
    description:
      "Spain and Germany co-development partnerships, expanding our platform into mature renewable energy markets with established regulatory frameworks.",
  },
];

export function GlobalMarkets() {
  return (
    <section id="markets" className="relative overflow-hidden bg-[var(--navy-mid)] py-36 lg:py-48">
      {/* Subtle perspective grid */}
      <div className="pointer-events-none absolute inset-0 perspective-grid opacity-20" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left column — narrative + stats + globe */}
          <div className="lg:col-span-5">
            <p className="section-eyebrow text-gold/70 mb-5">
              Global Reach
            </p>
            <h2 className="font-heading text-4xl leading-[1.08] tracking-[-0.02em] text-white md:text-5xl">
              Presence across{" "}
              <span className="italic text-gold">four continents</span>
            </h2>
            <p className="narrative-text mt-6 text-lg text-white/35">
              From Southeast Asia to Europe, we operate a network of funds
              connecting developers with institutional capital.
            </p>

            {/* Pull-quote stats */}
            <div className="mt-14 space-y-10">
              <div className="pull-quote">
                <p className="font-heading text-5xl font-light tracking-[-0.02em] text-white">
                  <Counter target={2.7} suffix=" GW" />
                </p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/25">
                  Total pipeline capacity
                </p>
              </div>
              <div className="pull-quote">
                <p className="font-heading text-5xl font-light tracking-[-0.02em] text-white">
                  <Counter target={28} />
                </p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/25">
                  Active projects worldwide
                </p>
              </div>
            </div>

            {/* 3D Interactive Globe with ambient glow */}
            <div className="mt-14 relative">
              <div className="pointer-events-none absolute inset-0 -inset-x-8 -inset-y-12 rounded-full bg-gold/[0.04] blur-[100px]" />
              <Globe3D />
            </div>
          </div>

          {/* Right: Editorial market entries */}
          <div className="flex flex-col lg:col-span-7">
            <div className="editorial-divider mb-6" />
            {MARKETS.map((market, i) => (
              <motion.div
                key={market.region}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 1.0,
                  delay: i * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`group py-8 px-4 -mx-4 rounded-lg transition-all duration-500 hover:bg-white/[0.02] hover:-translate-y-0.5 ${
                  i < MARKETS.length - 1 ? "border-b border-white/[0.05]" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
                  {/* Region name */}
                  <div className="sm:min-w-[160px]">
                    <h3 className="font-heading text-xl font-normal tracking-tight text-white/80">
                      {market.region}
                    </h3>
                  </div>

                  {/* Narrative description */}
                  <div className="flex-1">
                    <p className="narrative-text text-[14px] text-white/35">
                      {market.description}
                    </p>
                  </div>

                  {/* Capacity — inline pull-quote number */}
                  <div className="sm:text-right">
                    <p className="font-heading text-3xl font-light tracking-[-0.02em] text-gold/70 glow-breathe">
                      {market.capacity}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-white/20">
                      capacity
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
