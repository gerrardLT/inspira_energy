"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  CheckCircle,
  CircleNotch,
  Warning,
} from "@phosphor-icons/react";
import { submitFormJSON, type FormSubmitResult } from "@/lib/form-client";

const SERVICES = [
  {
    title: "Project Co-Investment",
    description:
      "Access capital from our development or equity funds to build your solar, storage, or wind project. We provide structured financing tailored to each stage of the project lifecycle, from early-stage development risk to construction and operation.",
    image: "/images/services/coinvest.png",
    imageAlt: "Solar panels in golden light",
  },
  {
    title: "Permit Transfer",
    description:
      "If your project doesn't fit our investment criteria, we connect you with qualified buyers in our network of over 50 institutional partners. Our team manages the entire transfer process — from valuation to closing.",
    image: "/images/services/permit.png",
    imageAlt: "Energy infrastructure planning",
  },
  {
    title: "COD Acquisition",
    description:
      "Sell your operational assets to our COD fund and unlock capital for your next development. We acquire commercial-operation-date projects with stable power purchase agreements, providing developers with liquidity to reinvest.",
    image: "/images/services/cod-acquisition.png",
    imageAlt: "Wind turbines in operation",
  },
];

export function ForDevelopers() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  return (
    <section id="developers" className="relative overflow-hidden bg-[var(--navy-lift)] py-32 lg:py-44">
      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* Header */}
        <div className="max-w-3xl">
          <p className="section-eyebrow text-gold mb-5">
            For Developers
          </p>
          <h2 className="font-heading text-4xl leading-[1.08] tracking-[-0.02em] text-white md:text-5xl">
            Capital solutions{" "}
            <span className="italic text-gold">for developers</span>
          </h2>
          <p className="narrative-text mt-6 text-lg text-white/40">
            Whether you need project financing, a buyer for your permit, or
            an operator for your built asset — we have a fund for you.
          </p>
        </div>

        {/* Editorial service spreads — image + narrative */}
        <div className="mt-20 space-y-20">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                delay: i * 0.1,
                duration: 1.0,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Full-width editorial image with Ken Burns */}
              <div className="relative aspect-[16/7] overflow-hidden">
                <img
                  src={service.image}
                  alt={service.imageAlt}
                  className="h-full w-full object-cover ken-burns"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy-lift)] via-[var(--navy-lift)]/30 to-transparent" />
                {/* Title overlay on image */}
                <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                  <h3 className="font-heading text-2xl tracking-tight text-white lg:text-3xl">
                    {service.title}
                  </h3>
                </div>
              </div>

              {/* Narrative paragraph below image */}
              <p className="narrative-text mt-6 text-[15px] text-white/40 lg:max-w-[60ch]">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA — editorial style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="mt-28"
        >
          <div className="editorial-divider mb-12" />
          <div id="contact" className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left: CTA narrative */}
            <div className="lg:col-span-5">
              <h3 className="font-heading text-2xl tracking-tight text-white lg:text-3xl">
                Interested in partnering?
              </h3>
              <p className="narrative-text mt-4 text-[15px] text-white/40">
                We work with developers across Southeast Asia, China, Australia,
                and Europe. Share your project details and our team will respond
                within 24 hours.
              </p>
            </div>

            {/* Right: Simplified form with spotlight */}
            <div className="lg:col-span-7 relative">
              <div className="pointer-events-none absolute -inset-8 rounded-2xl bg-gold/[0.02] blur-[80px]" />
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-start"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 text-gold">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <h4 className="mt-4 text-lg font-semibold text-white">
                      Submission received
                    </h4>
                    <p className="mt-2 text-[14px] text-white/40">
                      Our team will review your information and respond within 24 hours.
                    </p>
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

                      const company = (formData.get("company") as string) || "";
                      const email = (formData.get("email") as string) || "";
                      const region = (formData.get("region") as string) || "";
                      const projectType = (formData.get("projectType") as string) || "";

                      const payload: Record<string, unknown> = {
                        form_type: "general",
                        name: company,
                        email,
                        subject: "Developer Partnership Inquiry",
                        message: `Region: ${region}\nProject Type: ${projectType}`,
                      };

                      const result: FormSubmitResult = await submitFormJSON("/api/forms/contact", payload);

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
                    className="flex flex-col gap-5"
                  >
                    {submitError && (
                      <div className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 px-4 py-3 text-[13px] text-red-400">
                        <Warning className="h-4 w-4 shrink-0" />
                        <span>{submitError}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {[
                        { label: "Company", name: "company", type: "text", placeholder: "Your company" },
                        { label: "Email", name: "email", type: "email", placeholder: "you@company.com" },
                      ].map((field) => (
                        <div key={field.label}>
                          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                            {field.label}
                          </label>
                          <input
                            type={field.type}
                            name={field.name}
                            required
                            className={`h-11 w-full border ${fieldErrors[field.name] || (field.name === "company" && fieldErrors["name"]) ? "border-red-500/50" : "border-white/[0.08]"} bg-white/[0.03] px-3.5 text-[14px] text-white outline-none transition-all duration-300 placeholder:text-white/15 focus:border-gold/40 focus:bg-white/[0.05]`}
                            placeholder={field.placeholder}
                          />
                          {(fieldErrors[field.name] || (field.name === "company" && fieldErrors["name"])) && (
                            <p className="mt-1 text-[11px] text-red-400">{fieldErrors[field.name] || fieldErrors["name"]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                        Region
                      </label>
                      <select
                        name="region"
                        required
                        className="h-11 w-full border border-white/[0.08] bg-white/[0.03] px-3.5 text-[14px] text-white outline-none transition-all duration-300 focus:border-gold/40 focus:bg-white/[0.05] [&>option]:bg-navy [&>option]:text-white"
                        defaultValue=""
                      >
                        <option value="" disabled>Select region</option>
                        <option>Southeast Asia</option>
                        <option>China</option>
                        <option>Australia</option>
                        <option>Europe</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                        Project Type
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["Solar PV", "Energy Storage", "Wind Power", "Hybrid"].map((type) => (
                          <label key={type} className="group/chip cursor-pointer">
                            <input type="radio" name="projectType" value={type} className="sr-only peer" />
                            <span className="inline-flex h-9 items-center border border-white/[0.08] px-4 text-[12px] text-white/40 transition-all peer-checked:border-gold/40 peer-checked:bg-gold/10 peer-checked:text-gold hover:border-white/[0.15] hover:text-white/60">
                              {type}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative mt-2 inline-flex h-12 w-fit items-center justify-center gap-2.5 bg-accent px-8 text-[12px] font-semibold uppercase tracking-[0.1em] text-navy transition-all duration-300 hover:bg-accent/90 hover:shadow-[0_0_30px_oklch(0.70_0.12_78/25%)] active:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <CircleNotch className="h-4 w-4 animate-spin" />
                          Submit
                        </>
                      ) : (
                        <>
                          Submit
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
