"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import {
  Bank, ChartLineUp, Buildings, Lightning, ArrowRight,
  ShieldCheck, CheckCircle, CaretDown, CircleNotch, Warning,
} from "@phosphor-icons/react";
import { submitFormJSON, type FormSubmitResult } from "@/lib/form-client";

export default function FundsPage() {
  const t = useTranslations("funds");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const FUNDS = [
    {
      name: t("debtName"),
      tag: t("debtTag"),
      icon: Bank,
      targetReturn: "8-12%",
      risk: t("debtRisk"),
      minInvestment: t("debtMin"),
      lockup: t("debtLockup"),
      regions: t("debtRegions"),
      suitableFor: t("debtSuitable"),
      desc: t("debtDesc"),
      strategy: [t("debtStrategy1"), t("debtStrategy2"), t("debtStrategy3"), t("debtStrategy4")],
      image: "/images/funds/debt.png",
      imageAlt: "Wind turbines at sunset",
    },
    {
      name: t("equityName"),
      tag: t("equityTag"),
      icon: ChartLineUp,
      targetReturn: "15-22%",
      risk: t("equityRisk"),
      minInvestment: t("equityMin"),
      lockup: t("equityLockup"),
      regions: t("equityRegions"),
      suitableFor: t("equitySuitable"),
      desc: t("equityDesc"),
      strategy: [t("equityStrategy1"), t("equityStrategy2"), t("equityStrategy3"), t("equityStrategy4")],
      image: "/images/funds/equity.png",
      imageAlt: "Large-scale solar farm aerial",
    },
    {
      name: t("devName"),
      tag: t("devTag"),
      icon: Buildings,
      targetReturn: "20-30%",
      risk: t("devRisk"),
      minInvestment: t("devMin"),
      lockup: t("devLockup"),
      regions: t("devRegions"),
      suitableFor: t("devSuitable"),
      desc: t("devDesc"),
      strategy: [t("devStrategy1"), t("devStrategy2"), t("devStrategy3"), t("devStrategy4")],
      image: "/images/funds/development.png",
      imageAlt: "Solar panels under construction",
    },
    {
      name: t("codName"),
      tag: t("codTag"),
      icon: Lightning,
      targetReturn: "6-10%",
      risk: t("codRisk"),
      minInvestment: t("codMin"),
      lockup: t("codLockup"),
      regions: t("codRegions"),
      suitableFor: t("codSuitable"),
      desc: t("codDesc"),
      strategy: [t("codStrategy1"), t("codStrategy2"), t("codStrategy3"), t("codStrategy4")],
      image: "/images/funds/cod.png",
      imageAlt: "Wind turbines in operation",
    },
  ];

  const FAQS = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
    { q: t("faq6Q"), a: t("faq6A") },
    { q: t("faq7Q"), a: t("faq7A") },
    { q: t("faq8Q"), a: t("faq8A") },
  ];

  const FORM_FIELDS = [
    { label: t("formName"), name: "name", type: "text", placeholder: t("formNamePlaceholder"), required: true },
    { label: t("formInstitution"), name: "institution", type: "text", placeholder: t("formInstitutionPlaceholder"), required: true },
    { label: t("formPosition"), name: "position", type: "text", placeholder: t("formPositionPlaceholder"), required: false },
    { label: t("formEmail"), name: "email", type: "email", placeholder: t("formEmailPlaceholder"), required: true },
    { label: t("formPhone"), name: "phone", type: "tel", placeholder: t("formPhonePlaceholder"), required: false },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--navy-deep)] pt-[120px] pb-28 lg:pt-[140px] lg:pb-36">
        <div className="pointer-events-none absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero-funds.png" alt="" className="h-full w-full object-cover" style={{ opacity: 0.7 }} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--navy-deep)]/50 via-[var(--navy-deep)]/70 to-[var(--navy-deep)]" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-[600px] w-[600px] rounded-full bg-gold/[0.03] blur-[140px]" />
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <p className="section-eyebrow text-gold mb-5">{t("heroEyebrow")}</p>
          <h1 className="font-heading text-5xl leading-[1.05] tracking-[-0.02em] text-white md:text-6xl lg:text-7xl max-w-4xl">
            {t("heroTitle")}{" "}
            <span className="italic text-gold">{t("heroTitleAccent")}</span>
          </h1>
          <p className="narrative-text mt-6 text-lg text-white/40 max-w-2xl">
            {t("heroDesc")}
          </p>
        </div>
      </section>

      {/* Fund Overview Cards */}
      <section className="relative bg-[var(--navy)] py-24 lg:py-32">
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FUNDS.map((fund, i) => (
              <motion.div
                key={fund.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-500 hover:border-gold/20 hover:bg-white/[0.04]"
              >
                <fund.icon className="h-6 w-6 text-gold/50 mb-4" weight="duotone" />
                <h3 className="text-base font-semibold tracking-tight text-white/80">{fund.name}</h3>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20">{fund.tag}</span>
                <p className="mt-4 font-heading text-3xl font-light text-gold/80">{fund.targetReturn}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-white/20">{t("targetReturn")}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Fund Sections */}
      {FUNDS.map((fund, i) => (
        <section key={fund.name} className={`relative py-24 lg:py-32 ${i % 2 === 0 ? "bg-[var(--navy-mid)]" : "bg-[var(--navy)]"}`}>
          <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
            <div className={`grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 ${i % 2 !== 0 ? "lg:flex-row-reverse" : ""}`}>
              {/* Image */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                className={`${i % 2 === 0 ? "lg:col-span-5" : "lg:col-span-5 lg:order-2"}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={fund.image} alt={fund.imageAlt} className="h-full w-full object-cover ken-burns" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)]/50 to-transparent" />
                </div>
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 1.0, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={`${i % 2 === 0 ? "lg:col-span-7" : "lg:col-span-7 lg:order-1"}`}
              >
                <p className="section-eyebrow text-gold/50 mb-4">{fund.tag}</p>
                <h2 className="font-heading text-3xl tracking-tight text-white lg:text-4xl">{fund.name}</h2>
                <p className="narrative-text mt-4 text-[15px] text-white/40">{fund.desc}</p>

                {/* Key metrics table */}
                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {[
                    { label: t("labelTargetReturn"), value: fund.targetReturn },
                    { label: t("labelRiskLevel"), value: fund.risk },
                    { label: t("labelMinInvestment"), value: fund.minInvestment },
                    { label: t("labelLockup"), value: fund.lockup },
                    { label: t("labelRegions"), value: fund.regions },
                  ].map((metric) => (
                    <div key={metric.label} className="border border-white/[0.06] bg-white/[0.02] p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/20">{metric.label}</p>
                      <p className="mt-1 font-heading text-lg text-white/70">{metric.value}</p>
                    </div>
                  ))}
                </div>

                {/* Strategy points */}
                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-white/60 mb-4">{t("investmentStrategy")}</h4>
                  <ul className="space-y-3">
                    {fund.strategy.map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 shrink-0 text-gold/40 mt-0.5" weight="duotone" />
                        <span className="text-[13px] leading-relaxed text-white/35">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mt-6 text-[11px] text-white/20">
                  <span className="font-semibold">{t("suitableFor")}</span> {fund.suitableFor}
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      ))}

      {/* Risk-Return Comparison Table */}
      <section className="relative bg-[var(--navy-deep)] py-24 lg:py-32">
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <p className="section-eyebrow text-gold/60 mb-5">{t("comparisonEyebrow")}</p>
          <h2 className="font-heading text-3xl tracking-tight text-white md:text-4xl">
            {t("comparisonTitle")} <span className="italic text-gold">{t("comparisonTitleAccent")}</span>
          </h2>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="pb-4 pr-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t("colFund")}</th>
                  <th className="pb-4 pr-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t("colReturn")}</th>
                  <th className="pb-4 pr-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t("colRisk")}</th>
                  <th className="pb-4 pr-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t("colMinInvestment")}</th>
                  <th className="pb-4 pr-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t("colLockup")}</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t("colRegions")}</th>
                </tr>
              </thead>
              <tbody>
                {FUNDS.map((fund) => (
                  <tr key={fund.name} className="border-b border-white/[0.04] group hover:bg-white/[0.02]">
                    <td className="py-5 pr-6">
                      <div className="flex items-center gap-3">
                        <fund.icon className="h-4 w-4 text-gold/40" weight="duotone" />
                        <span className="text-sm font-semibold text-white/70">{fund.name}</span>
                      </div>
                    </td>
                    <td className="py-5 pr-6 font-heading text-xl text-gold/70">{fund.targetReturn}</td>
                    <td className="py-5 pr-6 text-[13px] text-white/40">{fund.risk}</td>
                    <td className="py-5 pr-6 text-[13px] text-white/40">{fund.minInvestment}</td>
                    <td className="py-5 pr-6 text-[13px] text-white/40">{fund.lockup}</td>
                    <td className="py-5 text-[13px] text-white/40">{fund.regions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative bg-[var(--navy)] py-24 lg:py-32">
        <div className="relative z-10 mx-auto max-w-[800px] px-6 lg:px-10">
          <p className="section-eyebrow text-gold/60 mb-5">{t("faqEyebrow")}</p>
          <h2 className="font-heading text-3xl tracking-tight text-white md:text-4xl">
            {t("faqTitle")} <span className="italic text-gold">{t("faqTitleAccent")}</span>
          </h2>

          <div className="mt-12 space-y-0">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="border-b border-white/[0.06]"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between py-5 text-left"
                >
                  <span className="text-[14px] font-medium text-white/70 pr-4">{faq.q}</span>
                  <CaretDown className={`h-4 w-4 shrink-0 text-white/30 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-[13px] leading-relaxed text-white/35">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LP Interest Form */}
      <section className="relative bg-[var(--navy-mid)] py-24 lg:py-32">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--navy)] via-transparent to-[var(--navy)]" />
        <div className="relative z-10 mx-auto max-w-[800px] px-6 lg:px-10">
          <p className="section-eyebrow text-gold mb-5">{t("formEyebrow")}</p>
          <h2 className="font-heading text-3xl tracking-tight text-white md:text-4xl">
            {t("formTitle")} <span className="italic text-gold">{t("formTitleAccent")}</span>
          </h2>
          <p className="narrative-text mt-4 text-[14px] text-white/35">
            {t("formDesc")}
          </p>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                className="mt-12 flex flex-col items-start"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 text-gold">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h4 className="mt-4 text-lg font-semibold text-white">{t("formSuccess")}</h4>
                <p className="mt-2 text-[14px] text-white/40">{t("formSuccessDesc")}</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  setSubmitError(null);
                  setFieldErrors({});

                  const form = e.currentTarget;
                  const formData = new FormData(form);

                  // 收集选中的 fund types
                  const fundTypes = formData.getAll("fundType") as string[];
                  // 收集选中的 regions
                  const regions = formData.getAll("region") as string[];

                  const payload: Record<string, unknown> = {
                    name: formData.get("name") || "",
                    institution: formData.get("institution") || "",
                    position: formData.get("position") || "",
                    email: formData.get("email") || "",
                    phone: formData.get("phone") || "",
                    fund_types: fundTypes,
                    regions,
                    investment_size: formData.get("investmentSize") || "",
                  };

                  const result: FormSubmitResult = await submitFormJSON("/api/forms/lp-interest", payload);

                  setIsSubmitting(false);

                  if (result.ok) {
                    setSubmitted(true);
                  } else {
                    setSubmitError(result.message);
                    if (result.fieldErrors) {
                      setFieldErrors(result.fieldErrors);
                    }
                  }
                }}
                className="mt-12 flex flex-col gap-5"
              >
                {submitError && (
                  <div className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 px-4 py-3 text-[13px] text-red-400">
                    <Warning className="h-4 w-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {FORM_FIELDS.map((field) => (
                    <div key={field.label}>
                      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                        {field.label} {field.required && <span className="text-gold/50">*</span>}
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        required={field.required}
                        className={`h-11 w-full border ${fieldErrors[field.name] ? "border-red-500/50" : "border-white/[0.08]"} bg-white/[0.03] px-3.5 text-[14px] text-white outline-none transition-all duration-300 placeholder:text-white/15 focus:border-gold/40 focus:bg-white/[0.05]`}
                        placeholder={field.placeholder}
                      />
                      {fieldErrors[field.name] && (
                        <p className="mt-1 text-[11px] text-red-400">{fieldErrors[field.name]}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Fund type multi-select */}
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">{t("formFundInterest")}</label>
                  <div className="flex flex-wrap gap-2">
                    {FUNDS.map((fund) => (
                      <label key={fund.name} className="group/chip cursor-pointer">
                        <input type="checkbox" name="fundType" value={fund.name} className="sr-only peer" />
                        <span className="inline-flex h-9 items-center border border-white/[0.08] px-4 text-[12px] text-white/40 transition-all peer-checked:border-gold/40 peer-checked:bg-gold/10 peer-checked:text-gold hover:border-white/[0.15] hover:text-white/60">
                          {fund.name}
                        </span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors["fund_types"] && (
                    <p className="mt-1 text-[11px] text-red-400">{fieldErrors["fund_types"]}</p>
                  )}
                </div>

                {/* Region multi-select */}
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">{t("formRegionInterest")}</label>
                  <div className="flex flex-wrap gap-2">
                    {[t("debtRegions").split(", ")].flat().map((region) => (
                      <label key={region} className="group/chip cursor-pointer">
                        <input type="checkbox" name="region" value={region} className="sr-only peer" />
                        <span className="inline-flex h-9 items-center border border-white/[0.08] px-4 text-[12px] text-white/40 transition-all peer-checked:border-gold/40 peer-checked:bg-gold/10 peer-checked:text-gold hover:border-white/[0.15] hover:text-white/60">
                          {region}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Investment size */}
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">{t("formInvestmentSize")}</label>
                  <select name="investmentSize" className="h-11 w-full border border-white/[0.08] bg-white/[0.03] px-3.5 text-[14px] text-white outline-none transition-all duration-300 focus:border-gold/40 focus:bg-white/[0.05] [&>option]:bg-navy [&>option]:text-white" defaultValue="">
                    <option value="" disabled>Select range</option>
                    <option>$1M - $10M</option>
                    <option>$10M - $50M</option>
                    <option>$50M+</option>
                  </select>
                  {fieldErrors["investment_size"] && (
                    <p className="mt-1 text-[11px] text-red-400">{fieldErrors["investment_size"]}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative mt-2 inline-flex h-12 w-fit items-center justify-center gap-2.5 bg-accent px-8 text-[12px] font-semibold uppercase tracking-[0.1em] text-navy transition-all duration-300 hover:bg-accent/90 hover:shadow-[0_0_30px_oklch(0.70_0.12_78/25%)] active:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <CircleNotch className="h-4 w-4 animate-spin" />
                      {t("formSubmit")}
                    </>
                  ) : (
                    <>
                      {t("formSubmit")}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Compliance */}
          <div className="mt-12 flex items-start gap-3 opacity-40">
            <ShieldCheck className="h-4 w-4 shrink-0 text-gold/30 mt-0.5" weight="duotone" />
            <p className="text-[10px] leading-relaxed text-white/25">
              {t("compliance")}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
