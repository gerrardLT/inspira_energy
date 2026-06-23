"use client";

import { motion } from "motion/react";
import { Bank, ChartLineUp, Buildings, Lightning, ArrowRight } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function HomepageFundsTeaser() {
  const t = useTranslations("home");

  const FUNDS = [
    { name: t("debtFundName"), tag: t("debtFundTag"), return: "8-12%", icon: Bank, desc: t("debtFundDesc") },
    { name: t("equityFundName"), tag: t("equityFundTag"), return: "15-22%", icon: ChartLineUp, desc: t("equityFundDesc") },
    { name: t("devFundName"), tag: t("devFundTag"), return: "20-30%", icon: Buildings, desc: t("devFundDesc") },
    { name: t("codFundName"), tag: t("codFundTag"), return: "6-10%", icon: Lightning, desc: t("codFundDesc") },
  ];

  return (
    <section className="relative overflow-hidden bg-[var(--navy)] py-28 lg:py-36">
      <div className="pointer-events-none absolute -left-24 -top-24 h-[600px] w-[600px] rounded-full bg-gold/[0.03] blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* Header */}
        <div className="max-w-3xl">
          <p className="section-eyebrow text-gold mb-5">{t("fundsEyebrow")}</p>
          <h2 className="font-heading text-4xl leading-[1.08] tracking-[-0.02em] text-white md:text-5xl">
            Four fund products,{" "}
            <span className="italic text-gold">{t("fundsTitleAccent")}</span>
          </h2>
          <p className="narrative-text mt-6 text-lg text-white/40">
            {t("fundsDesc")}
          </p>
        </div>

        {/* Mini fund cards grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FUNDS.map((fund, i) => (
            <motion.div
              key={fund.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group relative border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-500 hover:border-gold/20 hover:bg-white/[0.04] hover:-translate-y-1"
            >
              <fund.icon className="h-6 w-6 text-gold/50 mb-4" weight="duotone" />
              <h3 className="text-base font-semibold tracking-tight text-white/80 group-hover:text-white transition-colors">
                {fund.name}
              </h3>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20">
                {fund.tag}
              </span>
              <p className="mt-4 font-heading text-3xl font-light tracking-[-0.02em] text-gold/80">
                {fund.return}
              </p>
              <p className="mt-3 text-[12px] leading-relaxed text-white/30">
                {fund.desc}
              </p>
            </motion.div>
          ))}
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
            href="/funds"
            className="editorial-link text-gold/60 hover:text-gold"
          >
            {t("exploreFunds")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
