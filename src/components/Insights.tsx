"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, CheckCircle, Article, ChartLineUp, GlobeHemisphereWest } from "@phosphor-icons/react";

const SAMPLE_ARTICLES = [
  {
    category: "Market Report",
    icon: ChartLineUp,
    title: "Q4 2025: Southeast Asia Solar Deployment Accelerates",
    excerpt: "Vietnam and Thailand lead regional growth with 3.2 GW of new capacity, driven by favorable FIT policies.",
    date: "Dec 2025",
    readTime: "8 min",
  },
  {
    category: "Policy Brief",
    icon: GlobeHemisphereWest,
    title: "EU Carbon Border Tax: Implications for Asian Developers",
    excerpt: "How the CBAM mechanism creates new opportunities for cross-border renewable energy investment.",
    date: "Nov 2025",
    readTime: "5 min",
  },
  {
    category: "Research",
    icon: Article,
    title: "Battery Storage: The Next Frontier in APAC Fund Returns",
    excerpt: "Analysis of 18 BESS projects shows 14-18% IRR potential with current lithium pricing dynamics.",
    date: "Oct 2025",
    readTime: "12 min",
  },
];

export function Insights() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <section id="insights" className="relative overflow-hidden bg-[var(--navy)] py-32 lg:py-40">
      {/* Precision background: data grid */}
      <div className="pointer-events-none absolute inset-0 data-grid-bg opacity-30" />

      {/* Subtle gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--navy)] via-transparent to-[var(--navy)]" />

      {/* Data visualization pattern — right side */}
      <svg className="pointer-events-none absolute right-0 top-1/4 h-[400px] w-[300px] opacity-[0.05] hidden lg:block" viewBox="0 0 300 400" fill="none">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <line key={`h${i}`} x1="0" y1={i * 50} x2="300" y2={i * 50} stroke="oklch(0.70 0.12 78)" strokeWidth="0.3" />
        ))}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="400" stroke="oklch(0.70 0.12 78)" strokeWidth="0.3" />
        ))}
        <path d="M0 350 C50 320 100 280 150 250 C200 220 250 160 300 100" stroke="oklch(0.70 0.12 78)" strokeWidth="1" opacity="0.5" />
        <path d="M0 370 C50 340 100 310 150 290 C200 270 250 220 300 160" stroke="oklch(0.54 0.09 172)" strokeWidth="0.6" opacity="0.35" />
      </svg>

      {/* Subtle radial glow — center */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.015] blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="inline-flex items-center gap-3">
            <div className="h-px w-6 bg-accent/40" />
            <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-accent">
              Insights
            </p>
            <div className="h-px w-6 bg-accent/40" />
          </div>
          <h2 className="mt-5 font-heading text-4xl leading-[1.08] tracking-[-0.02em] text-white md:text-5xl">
            Market insights,{" "}
            <span className="italic text-accent">delivered quarterly</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/50">
            Receive our research on renewable energy investment trends, policy
            updates, and market opportunities across our target regions.
          </p>
        </motion.div>

        {/* Sample article cards */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {SAMPLE_ARTICLES.map((article, i) => (
            <motion.article
              key={article.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 1.0,
                delay: i * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative overflow-hidden border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-[2px] transition-all duration-500 hover:border-accent/20 hover:bg-white/[0.06]"
            >
              {/* Decorative organic shape in corner */}
              <svg className="absolute -right-4 -top-4 h-28 w-28 opacity-[0.07] transition-opacity duration-500 group-hover:opacity-[0.12]" viewBox="0 0 112 112" fill="none">
                <path d="M56 8 C84 4 108 24 110 56 C112 88 90 108 56 110 C22 108 2 88 2 56 C2 24 28 4 56 8Z" fill="var(--gold)" />
              </svg>

              {/* Category + icon */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent/70">
                  {article.category}
                </span>
                <article.icon className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-accent/50" weight="duotone" />
              </div>

              {/* Title */}
              <h3 className="mt-4 text-[15px] font-semibold leading-snug tracking-tight text-white/90 transition-colors group-hover:text-accent">
                {article.title}
              </h3>

              {/* Excerpt */}
              <p className="mt-3 text-[13px] leading-relaxed text-white/40">
                {article.excerpt}
              </p>

              {/* Footer */}
              <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
                <div className="flex items-center gap-3 text-[11px] text-white/30">
                  <span>{article.date}</span>
                  <span className="h-0.5 w-0.5 bg-muted-foreground/30" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
                  <span>{article.readTime} read</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-white/10 transition-all group-hover:text-accent" />
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 h-px w-12 bg-gradient-to-r from-accent/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </motion.article>
          ))}
        </div>

        {/* Newsletter signup */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 mx-auto max-w-xl text-center"
        >
          <p className="text-[13px] font-medium text-white/35 mb-6">
            Subscribe to receive insights directly to your inbox
          </p>
          {subscribed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 border border-teal/20 bg-teal/[0.08] px-8 py-4"
              style={{ clipPath: "polygon(2% 0%, 98% 0%, 100% 15%, 100% 100%, 0% 100%, 0% 15%)" }}
            >
              <CheckCircle className="h-5 w-5 text-teal" weight="duotone" />
              <p className="text-sm font-medium text-white">
                Subscribed. Check your inbox for confirmation.
              </p>
            </motion.div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubscribed(true);
              }}
              className="flex flex-col gap-3 sm:flex-row sm:justify-center"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 flex-1 max-w-xs border border-white/[0.1] bg-white/[0.05] px-4 text-[14px] text-white outline-none transition-all duration-300 placeholder:text-white/25 focus:border-accent/40 focus:shadow-[0_0_0_3px_oklch(0.70_0.12_78_/_8%)]"
                placeholder="your@email.com"
              />
              <button
                type="submit"
                className="group inline-flex h-12 items-center justify-center gap-2 bg-accent px-8 text-[13px] font-semibold uppercase tracking-[0.1em] text-navy transition-all duration-300 hover:bg-accent/90 active:-translate-y-[1px]"
                style={{ clipPath: "polygon(4% 0%, 100% 0%, 100% 85%, 96% 100%, 0% 100%, 0% 15%)" }}
              >
                Subscribe
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
