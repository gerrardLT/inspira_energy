"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import {
  EnvelopeSimple, Phone, MapPin, Clock, ArrowRight,
  CheckCircle, Buildings, Bank, ChartLineUp, Lightning,
  Globe, User, Briefcase, ChatText,
} from "@phosphor-icons/react";

type FormMode = "investor" | "general";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ContactPage() {
  const t = useTranslations("contact");
  const [formMode, setFormMode] = useState<FormMode>("investor");
  const [submitted, setSubmitted] = useState(false);

  // Investor form fields
  const [invName, setInvName] = useState("");
  const [invCompany, setInvCompany] = useState("");
  const [invTitle, setInvTitle] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invPhone, setInvPhone] = useState("");
  const [invFunds, setInvFunds] = useState<string[]>([]);
  const [invRegions, setInvRegions] = useState<string[]>([]);
  const [invSize, setInvSize] = useState("");

  // General form fields
  const [genName, setGenName] = useState("");
  const [genEmail, setGenEmail] = useState("");
  const [genSubject, setGenSubject] = useState("");
  const [genMessage, setGenMessage] = useState("");

  const toggleMulti = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const INVESTMENT_SIZES = [t("under500k"), t("size500k1m"), t("size1m5m"), t("size5m20m"), t("size20m")];

  const OFFICE_INFO = [
    {
      icon: MapPin,
      label: t("headquarters"),
      value: t("addressValue"),
    },
    {
      icon: EnvelopeSimple,
      label: t("email"),
      value: "ir@inspiraenergy.com",
      link: "mailto:ir@inspiraenergy.com",
    },
    {
      icon: Phone,
      label: t("phone"),
      value: "+65 6812 8000",
      link: "tel:+6568128000",
    },
    {
      icon: Clock,
      label: t("officeHours"),
      value: t("officeHoursValue"),
    },
  ];

  return (
    <div className="bg-[#0a0a14] text-white">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-[160px] pb-20 lg:pt-[200px] lg:pb-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-gold/[0.04] via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <motion.p
            className="section-eyebrow"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t("heroEyebrow")}
          </motion.p>
          <motion.h1
            className="mt-6 font-heading text-5xl italic leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {t("heroTitle1")}
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #d4a853 0%, #f0d78c 50%, #b8860b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("heroTitle2")}
            </span>
          </motion.h1>
          <motion.p
            className="mt-6 max-w-[60ch] text-[15px] leading-relaxed text-white/40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {t("heroDesc")}
          </motion.p>
        </div>
      </section>

      {/* ── Dual Column: Info + Form ────────────────────── */}
      <section className="relative py-20 lg:py-28">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-20">
            {/* Left — Contact Information */}
            <div className="lg:col-span-4">
              <motion.h2
                className="font-heading text-2xl italic text-white/80"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                {t("ourOffice")}
              </motion.h2>
              <div className="editorial-divider my-8" />

              <div className="flex flex-col gap-8">
                {OFFICE_INFO.map((item, i) => (
                  <motion.div
                    key={item.label}
                    className="flex gap-4"
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02]">
                      <item.icon className="h-4 w-4 text-gold/60" weight="duotone" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
                        {item.label}
                      </p>
                      {item.link ? (
                        <a
                          href={item.link}
                          className="mt-1 block text-[14px] text-white/60 transition-colors hover:text-gold"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-1 whitespace-pre-line text-[14px] text-white/60">
                          {item.value}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Map Placeholder */}
              <motion.div
                className="mt-12 overflow-hidden rounded-lg border border-white/[0.06]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <div className="relative aspect-[4/3] bg-gradient-to-br from-white/[0.02] to-white/[0.01]">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <MapPin className="h-8 w-8 text-gold/30" weight="duotone" />
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/20">
                      {t("singaporeHQ")}
                    </p>
                    <p className="max-w-[30ch] text-center text-[12px] text-white/15">
                      {t("addressShort")}
                    </p>
                  </div>
                  {/* Decorative grid */}
                  <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }} />
                </div>
              </motion.div>

              {/* Regional Offices */}
              <motion.div
                className="mt-10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
                  {t("regionalPresence")}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {["Shanghai", "Ho Chi Minh City", "Sydney", "Madrid"].map((city) => (
                    <span
                      key={city}
                      className="rounded-full border border-white/[0.06] px-3 py-1 text-[11px] text-white/35"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right — Form */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    className="flex min-h-[500px] flex-col items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.01] p-12 text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                      <CheckCircle className="h-8 w-8 text-emerald-400" weight="duotone" />
                    </div>
                    <h3 className="mt-6 font-heading text-2xl italic text-white/80">
                      {t("thankYou")}
                    </h3>
                    <p className="mt-3 max-w-[50ch] text-[14px] leading-relaxed text-white/40">
                      {t("thankYouDesc")}
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="editorial-link mt-8 text-gold/60 hover:text-gold"
                    >
                      {t("sendAnother")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Form Mode Tabs */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFormMode("investor")}
                        className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] font-medium transition-all duration-300 ${
                          formMode === "investor"
                            ? "border border-gold/30 bg-gold/10 text-gold"
                            : "border border-white/[0.06] text-white/35 hover:border-white/10 hover:text-white/60"
                        }`}
                      >
                        <ChartLineUp className="h-3.5 w-3.5" />
                        {t("investorInquiry")}
                      </button>
                      <button
                        onClick={() => setFormMode("general")}
                        className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] font-medium transition-all duration-300 ${
                          formMode === "general"
                            ? "border border-gold/30 bg-gold/10 text-gold"
                            : "border border-white/[0.06] text-white/35 hover:border-white/10 hover:text-white/60"
                        }`}
                      >
                        <ChatText className="h-3.5 w-3.5" />
                        {t("generalInquiry")}
                      </button>
                    </div>

                    <form
                      onSubmit={handleSubmit}
                      className="mt-8 rounded-lg border border-white/[0.06] bg-white/[0.01] p-8 lg:p-10"
                    >
                      <AnimatePresence mode="wait">
                        {formMode === "investor" ? (
                          <motion.div
                            key="investor-form"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3 }}
                          >
                            <h3 className="font-heading text-xl italic text-white/70">
                              {t("investorTitle")}
                            </h3>
                            <p className="mt-2 text-[13px] text-white/30">
                              {t("investorDesc")}
                            </p>

                            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                              <Field
                                icon={User}
                                label={t("fullName")}
                                required
                                value={invName}
                                onChange={setInvName}
                                placeholder={t("fullNamePh")}
                              />
                              <Field
                                icon={Buildings}
                                label={t("institution")}
                                required
                                value={invCompany}
                                onChange={setInvCompany}
                                placeholder={t("institutionPh")}
                              />
                              <Field
                                icon={Briefcase}
                                label={t("position")}
                                value={invTitle}
                                onChange={setInvTitle}
                                placeholder={t("positionPh")}
                              />
                              <Field
                                icon={EnvelopeSimple}
                                label={t("emailLabel")}
                                type="email"
                                required
                                value={invEmail}
                                onChange={setInvEmail}
                                placeholder={t("emailPh")}
                              />
                              <Field
                                icon={Phone}
                                label={t("phoneLabel")}
                                value={invPhone}
                                onChange={setInvPhone}
                                placeholder={t("phonePh")}
                              />
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                                  {t("investmentSize")}
                                </label>
                                <select
                                  value={invSize}
                                  onChange={(e) => setInvSize(e.target.value)}
                                  className="mt-2 w-full rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[13px] text-white/60 outline-none transition-colors focus:border-gold/30"
                                >
                                  <option value="" className="bg-[#0a0a14]">
                                    Select range
                                  </option>
                                  {INVESTMENT_SIZES.map((s) => (
                                    <option key={s} value={s} className="bg-[#0a0a14]">
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Fund Type — Multi-select */}
                            <div className="mt-6">
                              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                                {t("fundInterest")}
                              </label>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {["Debt Fund", "Equity Fund", "Development Fund", "COD Fund"].map((f) => (
                                  <button
                                    key={f}
                                    type="button"
                                    onClick={() => toggleMulti(invFunds, setInvFunds, f)}
                                    className={`rounded-full px-4 py-1.5 text-[12px] transition-all duration-200 ${
                                      invFunds.includes(f)
                                        ? "border border-gold/30 bg-gold/10 text-gold"
                                        : "border border-white/[0.06] text-white/35 hover:border-white/10"
                                    }`}
                                  >
                                    {f}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Region — Multi-select */}
                            <div className="mt-6">
                              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                                <Globe className="h-3 w-3" />
                                {t("regionInterest")}
                              </label>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {["Southeast Asia", "China", "Australia", "Europe"].map((r) => (
                                  <button
                                    key={r}
                                    type="button"
                                    onClick={() => toggleMulti(invRegions, setInvRegions, r)}
                                    className={`rounded-full px-4 py-1.5 text-[12px] transition-all duration-200 ${
                                      invRegions.includes(r)
                                        ? "border border-gold/30 bg-gold/10 text-gold"
                                        : "border border-white/[0.06] text-white/35 hover:border-white/10"
                                    }`}
                                  >
                                    {r}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="general-form"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3 }}
                          >
                            <h3 className="font-heading text-xl italic text-white/70">
                              {t("generalTitle")}
                            </h3>
                            <p className="mt-2 text-[13px] text-white/30">
                              {t("generalDesc")}
                            </p>

                            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                              <Field
                                icon={User}
                                label={t("name")}
                                required
                                value={genName}
                                onChange={setGenName}
                                placeholder={t("namePh")}
                              />
                              <Field
                                icon={EnvelopeSimple}
                                label={t("emailLabel")}
                                type="email"
                                required
                                value={genEmail}
                                onChange={setGenEmail}
                                placeholder="you@email.com"
                              />
                            </div>

                            <div className="mt-6">
                              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                                {t("subject")}
                              </label>
                              <input
                                value={genSubject}
                                onChange={(e) => setGenSubject(e.target.value)}
                                placeholder={t("subjectPh")}
                                className="mt-2 w-full rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[13px] text-white/60 outline-none transition-colors placeholder:text-white/20 focus:border-gold/30"
                              />
                            </div>

                            <div className="mt-6">
                              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                                {t("message")}
                              </label>
                              <textarea
                                value={genMessage}
                                onChange={(e) => setGenMessage(e.target.value)}
                                rows={6}
                                placeholder={t("messagePh")}
                                className="mt-2 w-full resize-none rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[13px] text-white/60 outline-none transition-colors placeholder:text-white/20 focus:border-gold/30"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Submit */}
                      <div className="editorial-divider my-8" />
                      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <p className="text-[11px] text-white/20">
                          {t("respondNote")}
                        </p>
                        <button
                          type="submit"
                          className="group flex items-center gap-3 rounded-full border border-gold/30 bg-gold/10 px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-gold transition-all duration-300 hover:bg-gold/20 hover:shadow-[0_0_24px_oklch(0.70_0.12_78/20%)]"
                        >
                          {t("sendInquiry")}
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── Regulatory & Compliance ─────────────────────── */}
      <section className="border-t border-white/[0.04] py-16 lg:py-20">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="section-eyebrow">{t("regulatoryEyebrow")}</p>
              <h2 className="mt-4 font-heading text-2xl italic text-white/70">
                {t("regulatoryTitle")}
              </h2>
            </div>
            <div className="space-y-6 lg:col-span-7">
              <p className="narrative-text text-white/35">
                {t("regulatoryText1")}
              </p>
              <p className="narrative-text text-white/25">
                {t("regulatoryText2")}
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                {[
                  { icon: Bank, text: t("masLicensed") },
                  { icon: Lightning, text: t("sfaCompliant") },
                  { icon: Globe, text: t("crossBorder") },
                ].map((badge) => (
                  <div
                    key={badge.text}
                    className="flex items-center gap-2 rounded-full border border-white/[0.04] px-4 py-2"
                  >
                    <badge.icon className="h-3.5 w-3.5 text-gold/30" weight="duotone" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/25">
                      {badge.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── Reusable Field Component ─────────────────────────── */
function Field({
  icon: Icon,
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
        <Icon className="h-3 w-3 text-white/25" />
        {label}
        {required && <span className="text-gold/40">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[13px] text-white/60 outline-none transition-colors placeholder:text-white/20 focus:border-gold/30"
      />
    </div>
  );
}
