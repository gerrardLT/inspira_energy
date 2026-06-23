"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { ArrowRight, MapPin } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";

export function HomepageMarketsTeaser() {
  const t = useTranslations("home");

  const MARKETS = [
    {
      region: t("southeastAsia"),
      countries: t("seaCountries"),
      capacity: "850 MW",
      status: t("active"),
    },
    {
      region: t("china"),
      countries: t("chinaCountries"),
      capacity: "1.2 GW",
      status: t("active"),
    },
    {
      region: t("australia"),
      countries: t("ausCountries"),
      capacity: "420 MW",
      status: t("active"),
    },
    {
      region: t("europe"),
      countries: t("euCountries"),
      capacity: "280 MW",
      status: t("expanding"),
    },
  ];

  const STATS = [
    { value: "2.7 GW", label: t("pipelineCapacity") },
    { value: "28", label: t("activeProjects") },
    { value: "12", label: t("countries") },
  ];

  return (
    <section className="relative overflow-hidden bg-[var(--navy-mid)] py-28 lg:py-36">
      <div className="pointer-events-none absolute inset-0 perspective-grid opacity-15" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* Header */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="section-eyebrow text-gold/70 mb-5">{t("marketsEyebrow")}</p>
            <h2 className="font-heading text-4xl leading-[1.08] tracking-[-0.02em] text-white md:text-5xl">
              {t("marketsTitle")}{" "}
              <span className="italic text-gold">{t("marketsTitleAccent")}</span>
            </h2>
            <p className="narrative-text mt-6 text-lg text-white/35">
              {t("marketsDesc")}
            </p>

            {/* Quick stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="font-heading text-2xl font-light tracking-tight text-white">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/25">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: market entries */}
          <div className="flex flex-col lg:col-span-7">
            <div className="editorial-divider mb-6" />
            {MARKETS.map((market, i) => (
              <motion.div
                key={market.region}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`flex items-center gap-6 py-6 ${
                  i < MARKETS.length - 1 ? "border-b border-white/[0.05]" : ""
                }`}
              >
                <MapPin className="h-4 w-4 shrink-0 text-gold/30" weight="duotone" />
                <div className="flex-1">
                  <h3 className="font-heading text-lg font-normal tracking-tight text-white/80">
                    {market.region}
                  </h3>
                  <p className="mt-1 text-[12px] text-white/30">{market.countries}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-2xl font-light tracking-tight text-gold/70">
                    {market.capacity}
                  </p>
                  <span className={`mt-1 inline-block text-[9px] font-bold uppercase tracking-[0.2em] ${
                    market.status === t("active") ? "text-teal/60" : "text-gold/40"
                  }`}>
                    {market.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA link */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex items-center gap-3"
        >
          <div className="editorial-divider flex-1" />
          <Link
            href="/markets"
            className="editorial-link text-gold/60 hover:text-gold"
          >
            {t("viewGlobal")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
