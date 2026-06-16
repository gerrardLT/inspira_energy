"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Handshake,
  ArrowRight,
  CurrencyDollar,
  Wrench,
  CheckCircle,
} from "@phosphor-icons/react";

const SERVICES = [
  {
    step: "01",
    icon: CurrencyDollar,
    title: "Project Co-Investment",
    description:
      "Access capital from our development or equity funds to build your solar, storage, or wind project.",
  },
  {
    step: "02",
    icon: Handshake,
    title: "Permit Transfer",
    description:
      "If your project doesn't fit our criteria, we connect you with qualified buyers in our network.",
  },
  {
    step: "03",
    icon: Wrench,
    title: "COD Acquisition",
    description:
      "Sell your operational assets to our COD fund and unlock capital for your next development.",
  },
];

export function ForDevelopers() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="developers" className="relative overflow-hidden navy-bg py-32 lg:py-40 noise-overlay">
      {/* Decorative layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/4 h-[400px] w-[400px] rounded-full bg-gold/[0.03] blur-[100px]" />
        <div className="absolute -right-20 bottom-1/3 h-[300px] w-[300px] rounded-full bg-teal/[0.04] blur-[80px]" />
        {/* Grid pattern */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-20 lg:grid-cols-12 lg:gap-24">
          {/* Left: Services with step visualization */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-gold/60" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold">
                For Developers
              </p>
            </div>
            <h2 className="mt-5 font-heading text-4xl leading-[1.08] tracking-[-0.02em] text-white md:text-5xl">
              Capital solutions{" "}
              <span
                className="italic"
                style={{
                  background: 'linear-gradient(135deg, var(--gold), oklch(0.80 0.10 85))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                }}
              >for developers</span>
            </h2>
            <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-white/40">
              Whether you need project financing, a buyer for your permit, or
              an operator for your built asset, we have a fund for you.
            </p>

            {/* Service cards with step numbers */}
            <div className="mt-14 flex flex-col gap-0">
              {SERVICES.map((service, i) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: i * 0.15,
                    duration: 1.0,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="group relative flex gap-6 border-l border-white/[0.08] py-8 pl-8 transition-all hover:border-gold/30"
                >
                  {/* Step number */}
                  <div className="absolute -left-[9px] top-8 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white/10 bg-navy transition-all group-hover:border-gold/40 group-hover:bg-gold/10">
                    <div className="h-1.5 w-1.5 rounded-full bg-white/30 transition-all group-hover:bg-gold" />
                  </div>

                  {/* Icon */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-gold/70 transition-all group-hover:border-gold/25 group-hover:text-gold">
                    <service.icon className="h-5 w-5" weight="duotone" />
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-white/20">
                        {service.step}
                      </span>
                      <h3 className="text-base font-semibold text-white">
                        {service.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/35">
                      {service.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div
            id="contact"
            className="border border-white/[0.06] bg-white/[0.02] p-10 backdrop-blur-md lg:col-span-7 lg:p-16"
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                  className="flex min-h-[420px] flex-col items-center justify-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 text-gold"
                  >
                    <CheckCircle className="h-8 w-8" />
                  </motion.div>
                  <h3 className="mt-6 text-xl font-semibold text-white">
                    Submission received
                  </h3>
                  <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-white/40">
                    Our team will review your information and respond within 24
                    hours. Thank you for your interest.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h3 className="text-xl font-semibold text-white">
                    Submit project information
                  </h3>
                  <p className="mt-2 text-[13px] text-white/35">
                    All submissions are treated as confidential.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSubmitted(true);
                    }}
                    className="mt-8 flex flex-col gap-5"
                  >
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {[
                        { label: "Company Name", type: "text", placeholder: "Your company" },
                        { label: "Contact Person", type: "text", placeholder: "Full name" },
                        { label: "Email", type: "email", placeholder: "you@company.com" },
                      ].map((field) => (
                        <div key={field.label}>
                          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
                            {field.label}
                          </label>
                          <input
                            type={field.type}
                            required
                            className="h-11 w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3.5 text-[14px] text-white outline-none transition-all duration-300 placeholder:text-white/15 focus:border-gold/40 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_oklch(0.70_0.12_78_/_8%)]"
                            placeholder={field.placeholder}
                          />
                        </div>
                      ))}
                      <div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
                          Region
                        </label>
                        <select
                          required
                          className="h-11 w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3.5 text-[14px] text-white outline-none transition-all duration-300 focus:border-gold/40 focus:bg-white/[0.05] [&>option]:bg-navy [&>option]:text-white"
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
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
                        Project Type
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["Solar PV", "Energy Storage", "Wind Power", "Hybrid"].map((type) => (
                          <label
                            key={type}
                            className="group/chip cursor-pointer"
                          >
                            <input type="radio" name="projectType" value={type} className="sr-only peer" />
                            <span className="inline-flex h-9 items-center rounded-md border border-white/[0.08] px-4 text-[12px] text-white/40 transition-all peer-checked:border-gold/40 peer-checked:bg-gold/10 peer-checked:text-gold hover:border-white/[0.15] hover:text-white/60">
                              {type}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
                        Additional Notes
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-[14px] text-white outline-none transition-all duration-300 placeholder:text-white/15 focus:border-gold/40 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_oklch(0.70_0.12_78_/_8%)]"
                        placeholder="Capacity, current stage, timeline, etc."
                      />
                    </div>

                    <button
                      type="submit"
                      className="group mt-2 inline-flex h-12 items-center justify-center gap-2.5 rounded-md bg-accent px-8 text-[13px] font-semibold uppercase tracking-[0.1em] text-navy transition-all duration-300 hover:bg-accent/90 hover:shadow-[0_0_30px_oklch(0.70_0.12_78_/_20%)] active:-translate-y-[1px]"
                    >
                      Submit
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
