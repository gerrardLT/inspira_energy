"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { ArrowRight, ChartLineUp, Wrench } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";

export function HomepageCTA() {
  const t = useTranslations("home");

  return (
    <section className="relative overflow-hidden bg-[var(--navy-deep)] py-28 lg:py-36">
      {/* Ambient gold glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-gold/[0.03] blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto"
        >
          <p className="section-eyebrow text-gold/60 mb-5">{t("ctaEyebrow")}</p>
          <h2 className="font-heading text-4xl leading-[1.08] tracking-[-0.02em] text-white md:text-5xl">
            {t("ctaTitle")}{" "}
            <span className="italic text-gold">{t("ctaTitleAccent")}</span>?
          </h2>
          <p className="narrative-text mt-6 text-lg text-white/35">
            {t("ctaDesc")}
          </p>
        </motion.div>

        {/* Dual CTA cards */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Investor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href="/funds"
              className="group block border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-500 hover:border-gold/20 hover:bg-white/[0.04] hover:-translate-y-1"
            >
              <ChartLineUp className="h-8 w-8 text-gold/50 mb-6" weight="duotone" />
              <h3 className="font-heading text-2xl tracking-tight text-white/80 group-hover:text-white transition-colors">
                {t("investorCard")}
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-white/30 max-w-[40ch]">
                {t("investorCardDesc")}
              </p>
              <div className="mt-6 flex items-center gap-2 text-gold/60 group-hover:text-gold transition-colors">
                <span className="text-[12px] font-semibold uppercase tracking-[0.1em]">
                  {t("viewFunds")}
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.div>

          {/* Developer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href="/developers"
              className="group block border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-500 hover:border-gold/20 hover:bg-white/[0.04] hover:-translate-y-1"
            >
              <Wrench className="h-8 w-8 text-gold/50 mb-6" weight="duotone" />
              <h3 className="font-heading text-2xl tracking-tight text-white/80 group-hover:text-white transition-colors">
                {t("developerCard")}
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-white/30 max-w-[40ch]">
                {t("developerCardDesc")}
              </p>
              <div className="mt-6 flex items-center gap-2 text-gold/60 group-hover:text-gold transition-colors">
                <span className="text-[12px] font-semibold uppercase tracking-[0.1em]">
                  {t("developerServices")}
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
