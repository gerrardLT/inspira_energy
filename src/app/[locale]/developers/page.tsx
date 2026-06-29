"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, CheckCircle, CaretDown,
  Handshake, FileText, ClipboardText, Rocket,
  CircleNotch, Warning,
} from "@phosphor-icons/react";
import { submitFormData, type FormSubmitResult } from "@/lib/form-client";

export default function DevelopersPage() {
  const t = useTranslations("developers");
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SERVICES = [
    {
      title: t("coInvestTitle"),
      desc: t("coInvestDesc"),
      details: [t("coInvest1"), t("coInvest2"), t("coInvest3"), t("coInvest4")],
      image: "/images/services/coinvest.png",
      imageAlt: "Solar panels in golden light",
    },
    {
      title: t("permitTitle"),
      desc: t("permitDesc"),
      details: [t("permit1"), t("permit2"), t("permit3"), t("permit4")],
      image: "/images/services/permit.png",
      imageAlt: "Energy infrastructure planning",
    },
    {
      title: t("codTitle"),
      desc: t("codDesc"),
      details: [t("cod1"), t("cod2"), t("cod3"), t("cod4")],
      image: "/images/services/cod-acquisition.png",
      imageAlt: "Wind turbines in operation",
    },
  ];

  const PROCESS_STEPS = [
    { icon: FileText, step: "01", title: t("step1Title"), desc: t("step1Desc") },
    { icon: ClipboardText, step: "02", title: t("step2Title"), desc: t("step2Desc") },
    { icon: Handshake, step: "03", title: t("step3Title"), desc: t("step3Desc") },
    { icon: Rocket, step: "04", title: t("step4Title"), desc: t("step4Desc") },
  ];

  const CASE_STUDIES = [
    {
      title: t("case1Title"),
      developer: t("case1Dev"),
      capacity: "120 MW",
      outcome: t("case1Outcome"),
    },
    {
      title: t("case2Title"),
      developer: t("case2Dev"),
      capacity: "80 MW",
      outcome: t("case2Outcome"),
    },
    {
      title: t("case3Title"),
      developer: t("case3Dev"),
      capacity: "60 MW + 30 MWh",
      outcome: t("case3Outcome"),
    },
  ];

  const FAQS = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
    { q: t("faq6Q"), a: t("faq6A") },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--navy-deep)] pt-[120px] pb-28 lg:pt-[140px] lg:pb-36">
        <div className="pointer-events-none absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero-developers.png" alt="" className="h-full w-full object-cover" style={{ opacity: 0.7 }} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--navy-deep)]/50 via-[var(--navy-deep)]/70 to-[var(--navy-deep)]" />
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

      {/* Services */}
      <section className="relative bg-[var(--navy)] py-24 lg:py-32">
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="space-y-24">
            {SERVICES.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ delay: i * 0.1, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative aspect-[16/7] overflow-hidden">
                  <img src={service.image} alt={service.imageAlt} className="h-full w-full object-cover ken-burns" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)] via-[var(--navy)]/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                    <h3 className="font-heading text-2xl tracking-tight text-white lg:text-3xl">{service.title}</h3>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
                  <p className="narrative-text text-[15px] text-white/40 lg:col-span-5">{service.desc}</p>
                  <ul className="space-y-3 lg:col-span-7">
                    {service.details.map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 shrink-0 text-gold/40 mt-0.5" weight="duotone" />
                        <span className="text-[13px] leading-relaxed text-white/35">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="relative bg-[var(--navy-mid)] py-24 lg:py-32">
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <p className="section-eyebrow text-gold/60 mb-5">{t("processEyebrow")}</p>
          <h2 className="font-heading text-3xl tracking-tight text-white md:text-4xl">
            {t("processTitle")} <span className="italic text-gold">{t("processTitleAccent")}</span>
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((ps, i) => (
              <motion.div
                key={ps.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="border border-white/[0.06] bg-white/[0.02] p-6 relative"
              >
                <span className="font-heading text-4xl font-light text-gold/20 absolute top-4 right-4">{ps.step}</span>
                <ps.icon className="h-6 w-6 text-gold/40 mb-4" weight="duotone" />
                <h4 className="text-base font-semibold text-white/80">{ps.title}</h4>
                <p className="mt-3 text-[13px] leading-relaxed text-white/30">{ps.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="relative bg-[var(--navy)] py-24 lg:py-32">
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <p className="section-eyebrow text-gold/50 mb-5">{t("casesEyebrow")}</p>
          <h2 className="font-heading text-3xl tracking-tight text-white md:text-4xl">
            {t("casesTitle")} <span className="italic text-gold">{t("casesTitleAccent")}</span>
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {CASE_STUDIES.map((cs, i) => (
              <motion.div
                key={cs.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="border border-white/[0.06] bg-white/[0.02] p-6"
              >
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gold/40">{cs.capacity}</span>
                <h4 className="mt-3 text-base font-semibold text-white/80">{cs.title}</h4>
                <p className="mt-1 text-[11px] text-accent/60">{cs.developer}</p>
                <p className="mt-4 text-[13px] leading-relaxed text-white/30">{cs.outcome}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Permit Submission Form — 3 steps */}
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
                ref={formRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (step < 3) {
                    setStep(step + 1);
                    return;
                  }

                  // Final step: submit to API
                  setIsSubmitting(true);
                  setSubmitError(null);
                  setFieldErrors({});

                  const form = formRef.current!;
                  const formData = new FormData(form);

                  // 确保所有字段名称映射到 API 期望的字段名
                  const apiFormData = new FormData();
                  apiFormData.set("company_name", (formData.get("company_name") as string) || "");
                  apiFormData.set("contact_name", (formData.get("contact_name") as string) || "");
                  apiFormData.set("email", (formData.get("email") as string) || "");
                  apiFormData.set("region", (formData.get("region") as string) || "");
                  apiFormData.set("project_type", (formData.get("projectType") as string) || "");
                  apiFormData.set("capacity_mw", (formData.get("capacity_mw") as string) || "");
                  apiFormData.set("project_stage", (formData.get("stage") as string) || "");
                  apiFormData.set("expected_construction_date", (formData.get("expected_construction_date") as string) || "");
                  apiFormData.set("notes", (formData.get("notes") as string) || "");

                  // 附加文件
                  if (fileInputRef.current?.files) {
                    for (const file of Array.from(fileInputRef.current.files)) {
                      apiFormData.append("files", file);
                    }
                  }

                  const result: FormSubmitResult = await submitFormData("/api/forms/developer", apiFormData);

                  setIsSubmitting(false);

                  if (result.ok) {
                    setSubmitted(true);
                  } else {
                    setSubmitError(result.message);
                    if (result.fieldErrors) {
                      setFieldErrors(result.fieldErrors);
                      // 如果有 step 1/2 的字段错误，导航到对应步骤
                      const step1Fields = ["company_name", "contact_name", "email"];
                      const step2Fields = ["region", "project_type", "capacity_mw"];
                      const errorFields = Object.keys(result.fieldErrors);
                      if (errorFields.some((f) => step1Fields.includes(f))) {
                        setStep(1);
                      } else if (errorFields.some((f) => step2Fields.includes(f))) {
                        setStep(2);
                      }
                    }
                  }
                }}
                className="mt-12"
              >
                {/* Progress bar */}
                <div className="flex items-center gap-2 mb-8">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex-1">
                      <div className={`h-1 rounded-full transition-all duration-500 ${s <= step ? "bg-gold/60" : "bg-white/[0.06]"}`} />
                      <p className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.15em] ${s <= step ? "text-gold/60" : "text-white/15"}`}>
                        {t("formStep")} {s}
                      </p>
                    </div>
                  ))}
                </div>

                {submitError && (
                  <div className="mb-6 flex items-center gap-2 border border-red-500/20 bg-red-500/5 px-4 py-3 text-[13px] text-red-400">
                    <Warning className="h-4 w-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-5">
                      {[
                        { label: t("formCompany"), name: "company_name", type: "text", placeholder: t("formCompanyPh") },
                        { label: t("formContact"), name: "contact_name", type: "text", placeholder: t("formContactPh") },
                        { label: t("formEmail"), name: "email", type: "email", placeholder: t("formEmailPh") },
                      ].map((field) => (
                        <div key={field.name}>
                          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">{field.label} <span className="text-gold/50">*</span></label>
                          <input type={field.type} name={field.name} required className={`h-11 w-full border ${fieldErrors[field.name] ? "border-red-500/50" : "border-white/[0.08]"} bg-white/[0.03] px-3.5 text-[14px] text-white outline-none transition-all duration-300 placeholder:text-white/15 focus:border-gold/40 focus:bg-white/[0.05]`} placeholder={field.placeholder} />
                          {fieldErrors[field.name] && (
                            <p className="mt-1 text-[11px] text-red-400">{fieldErrors[field.name]}</p>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-5">
                      <div>
                        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">{t("formRegion")} <span className="text-gold/50">*</span></label>
                        <select name="region" required className={`h-11 w-full border ${fieldErrors["region"] ? "border-red-500/50" : "border-white/[0.08]"} bg-white/[0.03] px-3.5 text-[14px] text-white outline-none focus:border-gold/40 [&>option]:bg-navy`} defaultValue="">
                          <option value="" disabled>{t("formSelectRegion")}</option>
                          <option>Southeast Asia</option><option>China</option><option>Australia</option><option>Europe</option><option>Other</option>
                        </select>
                        {fieldErrors["region"] && (
                          <p className="mt-1 text-[11px] text-red-400">{fieldErrors["region"]}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">{t("formProjectType")} <span className="text-gold/50">*</span></label>
                        <div className="flex flex-wrap gap-2">
                          {[t("formSolar"), t("formStorage"), t("formWind"), t("formHybrid")].map((type) => (
                            <label key={type} className="cursor-pointer">
                              <input type="radio" name="projectType" value={type} className="sr-only peer" />
                              <span className="inline-flex h-9 items-center border border-white/[0.08] px-4 text-[12px] text-white/40 transition-all peer-checked:border-gold/40 peer-checked:bg-gold/10 peer-checked:text-gold hover:border-white/[0.15] hover:text-white/60">{type}</span>
                            </label>
                          ))}
                        </div>
                        {fieldErrors["project_type"] && (
                          <p className="mt-1 text-[11px] text-red-400">{fieldErrors["project_type"]}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">{t("formCapacity")} <span className="text-gold/50">*</span></label>
                        <input type="number" name="capacity_mw" required className={`h-11 w-full border ${fieldErrors["capacity_mw"] ? "border-red-500/50" : "border-white/[0.08]"} bg-white/[0.03] px-3.5 text-[14px] text-white outline-none focus:border-gold/40 placeholder:text-white/15`} placeholder={t("formCapacityPh")} />
                        {fieldErrors["capacity_mw"] && (
                          <p className="mt-1 text-[11px] text-red-400">{fieldErrors["capacity_mw"]}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                  {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-5">
                      <div>
                        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">{t("formStage")} <span className="text-gold/50">*</span></label>
                        <div className="flex flex-wrap gap-2">
                          {[t("formStagePermit"), t("formStageFeasibility"), t("formStageApproved"), t("formStageConstruction")].map((stage) => (
                            <label key={stage} className="cursor-pointer">
                              <input type="radio" name="stage" value={stage} className="sr-only peer" />
                              <span className="inline-flex h-9 items-center border border-white/[0.08] px-4 text-[12px] text-white/40 transition-all peer-checked:border-gold/40 peer-checked:bg-gold/10 peer-checked:text-gold hover:border-white/[0.15] hover:text-white/60">{stage}</span>
                            </label>
                          ))}
                        </div>
                        {fieldErrors["project_stage"] && (
                          <p className="mt-1 text-[11px] text-red-400">{fieldErrors["project_stage"]}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">{t("formConstructionDate")}</label>
                        <input type="date" name="expected_construction_date" className="h-11 w-full border border-white/[0.08] bg-white/[0.03] px-3.5 text-[14px] text-white outline-none focus:border-gold/40" />
                      </div>
                      <div>
                        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">{t("formNotes")}</label>
                        <textarea name="notes" rows={3} className="w-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-[14px] text-white outline-none focus:border-gold/40 placeholder:text-white/15 resize-none" placeholder={t("formNotesPh")} />
                      </div>
                      <div>
                        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">{t("formFiles") ?? "Files"}</label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                          className="w-full text-[13px] text-white/50 file:mr-3 file:border file:border-white/[0.08] file:bg-white/[0.03] file:px-4 file:py-2 file:text-[12px] file:text-white/50 file:cursor-pointer hover:file:border-gold/40"
                        />
                        <p className="mt-1 text-[10px] text-white/20">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG（最多 5 个文件，每个 ≤ 10MB）</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation buttons */}
                <div className="mt-8 flex items-center gap-4">
                  {step > 1 && (
                    <button type="button" onClick={() => setStep(step - 1)} className="h-11 px-6 text-[12px] font-semibold uppercase tracking-[0.1em] text-white/40 border border-white/[0.08] hover:border-white/[0.15] hover:text-white/60 transition-all">
                      {t("formPrevious")}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group h-12 inline-flex items-center justify-center gap-2.5 bg-accent px-8 text-[12px] font-semibold uppercase tracking-[0.1em] text-navy transition-all duration-300 hover:bg-accent/90 hover:shadow-[0_0_30px_oklch(0.70_0.12_78/25%)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <CircleNotch className="h-4 w-4 animate-spin" />
                        {t("formSubmitProject")}
                      </>
                    ) : (
                      <>
                        {step < 3 ? t("formNext") : t("formSubmitProject")}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Developer FAQ */}
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
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="border-b border-white/[0.06]"
              >
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between py-5 text-left">
                  <span className="text-[14px] font-medium text-white/70 pr-4">{faq.q}</span>
                  <CaretDown className={`h-4 w-4 shrink-0 text-white/30 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <p className="pb-5 text-[13px] leading-relaxed text-white/35">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
