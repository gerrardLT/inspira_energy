"use client";

import { useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useInView, animate } from "motion/react";
import { Globe3D } from "@/components/Globe3D";
import { MapPin, ArrowRight } from "@phosphor-icons/react";

function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const hasAnimated = useRef(false);
  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;
    const controls = animate(0, target, { duration: 2.2, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setCount(Math.round(v * 10) / 10) });
    return () => controls.stop();
  }, [inView, target]);
  return <span ref={ref}>{prefix}{count % 1 === 0 ? count : count.toFixed(1)}{suffix}</span>;
}

export default function MarketsPage() {
  const t = useTranslations("markets");

  const MARKETS = [
    {
      region: t("seaStatus"),
      regionName: "Southeast Asia",
      capacity: "850 MW",
      projects: 12,
      countries: ["Vietnam", "Thailand", "Philippines", "Indonesia"],
      status: t("seaStatus"),
      desc: t("seaDesc"),
      highlights: [t("seaH1"), t("seaH2"), t("seaH3"), t("seaH4")],
      policies: t("seaPolicy"),
    },
    {
      region: t("chinaStatus"),
      regionName: "China",
      capacity: "1.2 GW",
      projects: 10,
      countries: ["Jiangsu", "Guangdong", "Shandong", "Hebei"],
      status: t("chinaStatus"),
      desc: t("chinaDesc"),
      highlights: [t("chinaH1"), t("chinaH2"), t("chinaH3"), t("chinaH4")],
      policies: t("chinaPolicy"),
    },
    {
      region: t("ausStatus"),
      regionName: "Australia",
      capacity: "420 MW",
      projects: 4,
      countries: ["Queensland", "New South Wales", "Victoria"],
      status: t("ausStatus"),
      desc: t("ausDesc"),
      highlights: [t("ausH1"), t("ausH2"), t("ausH3"), t("ausH4")],
      policies: t("ausPolicy"),
    },
    {
      region: t("euStatus"),
      regionName: "Europe",
      capacity: "280 MW",
      projects: 2,
      countries: ["Spain", "Germany", "Portugal"],
      status: t("euStatus"),
      desc: t("euDesc"),
      highlights: [t("euH1"), t("euH2"), t("euH3"), t("euH4")],
      policies: t("euPolicy"),
    },
  ];

  const ROADMAP = [
    { year: "2023", event: t("r1") },
    { year: "2024 Q1", event: t("r2") },
    { year: "2024 Q3", event: t("r3") },
    { year: "2025 Q1", event: t("r4") },
    { year: "2025 Q4", event: t("r5") },
    { year: "2026", event: t("r6") },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--navy-deep)] pt-[120px] pb-28 lg:pt-[140px] lg:pb-36">
        <div className="pointer-events-none absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero-markets.png" alt="" className="h-full w-full object-cover" style={{ opacity: 0.35 }} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--navy-deep)]/50 via-[var(--navy-deep)]/70 to-[var(--navy-deep)]" />
        <div className="pointer-events-none absolute inset-0 perspective-grid opacity-15" />
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <p className="section-eyebrow text-gold/70 mb-5">{t("heroEyebrow")}</p>
          <h1 className="font-heading text-5xl leading-[1.05] tracking-[-0.02em] text-white md:text-6xl lg:text-7xl max-w-4xl">
            {t("heroTitle")}{" "}
            <span className="italic text-gold">{t("heroTitleAccent")}</span>
          </h1>
          <p className="narrative-text mt-6 text-lg text-white/35 max-w-2xl">
            {t("heroDesc")}
          </p>
        </div>
      </section>

      {/* Global stats + Globe */}
      <section className="relative bg-[var(--navy)] py-24 lg:py-32">
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-8">
                {[
                  { value: 2.7, suffix: " GW", label: t("totalPipeline") },
                  { value: 28, suffix: "", label: t("activeProjectsLabel") },
                  { value: 4, suffix: "", label: t("continents") },
                  { value: 12, suffix: "", label: t("countriesOps") },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="font-heading text-4xl font-light tracking-tight text-white">
                      <Counter target={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/25">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Globe */}
              <div className="mt-14 relative">
                <div className="pointer-events-none absolute inset-0 -inset-x-8 -inset-y-12 rounded-full bg-gold/[0.04] blur-[100px]" />
                <Globe3D />
              </div>
            </div>

            {/* Market entries */}
            <div className="lg:col-span-7">
              <div className="editorial-divider mb-8" />
              {MARKETS.map((market, i) => (
                <motion.div
                  key={market.regionName}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex items-start gap-6 py-6 ${i < MARKETS.length - 1 ? "border-b border-white/[0.05]" : ""}`}
                >
                  <MapPin className="h-5 w-5 shrink-0 text-gold/30 mt-1" weight="duotone" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-heading text-xl font-normal tracking-tight text-white/80">{market.regionName}</h3>
                      <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${market.status === "Active" ? "text-teal/60" : market.status === "Expanding" ? "text-gold/50" : "text-accent/60"}`}>
                        {market.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/25 mb-1">{market.countries.join(" · ")}</p>
                    <p className="text-[13px] text-white/30">{market.projects} {t("projects")} · {market.capacity}</p>
                  </div>
                  <p className="font-heading text-3xl font-light tracking-tight text-gold/70">{market.capacity}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Regional Sections */}
      {MARKETS.map((market, i) => (
        <section key={market.regionName} className={`relative py-24 lg:py-32 ${i % 2 === 0 ? "bg-[var(--navy-mid)]" : "bg-[var(--navy)]"}`}>
          <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
            <p className="section-eyebrow text-gold/50 mb-4">{market.status}</p>
            <h2 className="font-heading text-3xl tracking-tight text-white md:text-4xl">{market.regionName}</h2>
            <p className="narrative-text mt-4 text-[15px] text-white/40 max-w-3xl">{market.desc}</p>

            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Highlights */}
              <div className="lg:col-span-7">
                <h4 className="text-sm font-semibold text-white/60 mb-4">{t("activeProjects")}</h4>
                <ul className="space-y-3">
                  {market.highlights.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/40" />
                      <span className="text-[13px] leading-relaxed text-white/35">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Policy sidebar */}
              <div className="lg:col-span-5 lg:pl-8 border-l border-white/[0.06]">
                <h4 className="text-sm font-semibold text-white/60 mb-4">{t("policyEnv")}</h4>
                <p className="text-[13px] leading-relaxed text-white/30">{market.policies}</p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/20">{t("capacity")}</p>
                    <p className="mt-1 font-heading text-xl text-gold/70">{market.capacity}</p>
                  </div>
                  <div className="border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/20">{t("projects")}</p>
                    <p className="mt-1 font-heading text-xl text-gold/70">{market.projects}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Expansion Roadmap */}
      <section className="relative bg-[var(--navy-deep)] py-24 lg:py-32">
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <p className="section-eyebrow text-gold/60 mb-5">{t("roadmapEyebrow")}</p>
          <h2 className="font-heading text-3xl tracking-tight text-white md:text-4xl">
            {t("roadmapTitle")} <span className="italic text-gold">{t("roadmapTitleAccent")}</span>
          </h2>

          <div className="mt-12 relative">
            <div className="absolute left-0 top-1/2 h-px w-full bg-white/[0.06] hidden md:block" />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-6">
              {ROADMAP.map((r, i) => (
                <motion.div
                  key={r.year}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="relative text-center"
                >
                  <div className="mx-auto h-3 w-3 rounded-full border-2 border-accent/50 bg-[var(--navy-deep)] relative z-10" />
                  <p className="mt-4 font-heading text-sm font-semibold text-accent">{r.year}</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-white/35">{r.event}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
