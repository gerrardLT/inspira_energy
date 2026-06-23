"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, CheckCircle, Download } from "@phosphor-icons/react";

const FEATURE_ARTICLE = {
  category: "Market Report",
  title: "Q4 2025: Southeast Asia Solar Deployment Accelerates",
  excerpt:
    "Vietnam and Thailand lead regional growth with 3.2 GW of new capacity, driven by favorable FIT policies and growing institutional investor appetite for renewable infrastructure.",
  date: "Dec 2025",
  readTime: "8 min",
  image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80&auto=format",
};

const SIDEBAR_ARTICLES = [
  {
    category: "Policy Brief",
    title: "EU Carbon Border Tax: Implications for Asian Developers",
    date: "Nov 2025",
    readTime: "5 min",
  },
  {
    category: "Research",
    title: "Battery Storage: The Next Frontier in APAC Fund Returns",
    date: "Oct 2025",
    readTime: "12 min",
  },
];

const CATEGORY_FILTERS = ["All", "Market Analysis", "ESG", "Fund Updates", "Policy"];

export function Insights() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <section id="insights" className="relative overflow-hidden bg-[var(--navy-deep)] py-32 lg:py-44">
      {/* Subtle gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--navy)] via-transparent to-[var(--navy)]" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <p className="section-eyebrow text-accent mb-5">
            Insights
          </p>
          <h2 className="font-heading text-4xl leading-[1.08] tracking-[-0.02em] text-white md:text-5xl">
            Market insights,{" "}
            <span className="italic text-accent">delivered quarterly</span>
          </h2>
          <p className="narrative-text mt-6 text-lg text-white/45">
            Receive our research on renewable energy investment trends, policy
            updates, and market opportunities across our target regions.
          </p>
        </motion.div>

        {/* Category filter chips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap gap-2"
        >
          {CATEGORY_FILTERS.map((cat, i) => (
            <span
              key={cat}
              className={`inline-flex h-8 items-center px-4 text-[11px] font-semibold uppercase tracking-[0.15em] transition-all cursor-pointer ${
                i === 0
                  ? "border border-accent/30 bg-accent/[0.08] text-accent"
                  : "border border-white/[0.06] text-white/25 hover:border-white/[0.12] hover:text-white/40"
              }`}
            >
              {cat}
            </span>
          ))}
        </motion.div>

        {/* Featured Report — editorial spread with light sweep */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-12 border border-accent/12 bg-white/[0.02] p-8 lg:p-10 transition-all duration-500 hover:border-accent/30 hover:shadow-[0_0_40px_oklch(0.70_0.12_78/8%)] overflow-hidden"
        >
          <div className="light-sweep" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                  Featured Report
                </span>
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/20">
                  Jan 2026
                </span>
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-white/85 lg:text-2xl">
                2026 Southeast Asia Solar Outlook:{" "}
                <span className="italic text-accent/80">Policy Tailwinds Meet Capital Deployment</span>
              </h3>
              <p className="mt-4 max-w-[60ch] text-[14px] leading-relaxed text-white/30">
                Our annual deep-dive into SEA solar markets — covering Vietnam&rsquo;s PDP8
                implementation, Thailand&rsquo;s BESS incentives, and Philippines&rsquo; Green
                Energy Auction pipeline. Based on 12 months of proprietary deal-flow data.
              </p>
              <div className="mt-6 flex items-center gap-4">
                <span className="text-[11px] text-white/25">By Wei Chen, Managing Partner</span>
                <span className="h-0.5 w-0.5 rounded-full bg-white/20" />
                <span className="text-[11px] text-white/25">24 pages</span>
              </div>
            </div>
            <div className="lg:col-span-4 flex items-end lg:items-center justify-start lg:justify-end">
              <a
                href="#"
                className="editorial-link text-accent/50 hover:text-accent"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            </div>
          </div>
        </motion.div>

        {/* Articles — 2-column editorial layout: feature + sidebar */}
        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Feature article — large */}
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 group"
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              <img
                src={FEATURE_ARTICLE.image}
                alt=""
                className="h-full w-full object-cover ken-burns transition-transform duration-700 group-hover:scale-[1.06]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy-deep)]/80 to-transparent" />
            </div>
            <div className="mt-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent/50">
                {FEATURE_ARTICLE.category}
              </span>
              <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight text-white/75 group-hover:text-white/90 transition-colors">
                {FEATURE_ARTICLE.title}
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-white/30 max-w-[55ch]">
                {FEATURE_ARTICLE.excerpt}
              </p>
              <div className="mt-4 flex items-center gap-3 text-[11px] text-white/25">
                <span>{FEATURE_ARTICLE.date}</span>
                <span className="h-0.5 w-0.5 rounded-full bg-white/20" />
                <span>{FEATURE_ARTICLE.readTime} read</span>
              </div>
            </div>
          </motion.article>

          {/* Sidebar articles — text-only */}
          <div className="lg:col-span-5 flex flex-col">
            {SIDEBAR_ARTICLES.map((article, i) => (
              <motion.article
                key={article.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`group py-6 ${
                  i < SIDEBAR_ARTICLES.length - 1 ? "border-b border-white/[0.05]" : ""
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent/40">
                  {article.category}
                </span>
                <h3 className="mt-2 text-[15px] font-semibold leading-snug tracking-tight text-white/65 group-hover:text-white/85 transition-colors">
                  {article.title}
                </h3>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-white/20">
                    <span>{article.date}</span>
                    <span className="h-0.5 w-0.5 rounded-full bg-white/15" />
                    <span>{article.readTime} read</span>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-white/10 transition-all duration-300 group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        {/* Newsletter — simplified inline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20"
        >
          <div className="editorial-divider mb-8" />
          {subscribed ? (
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-teal" weight="duotone" />
              <p className="text-sm text-white/50">
                Subscribed. Check your inbox for confirmation.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-white/30">
                Subscribe to receive insights directly to your inbox
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubscribed(true);
                }}
                className="flex gap-2"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-56 border border-white/[0.08] bg-white/[0.03] px-3.5 text-[13px] text-white outline-none transition-all duration-300 placeholder:text-white/20 focus:border-accent/40"
                  placeholder="your@email.com"
                />
                <button
                  type="submit"
                  className="group inline-flex h-10 items-center gap-2 bg-accent px-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy transition-all duration-300 hover:bg-accent/90"
                >
                  Subscribe
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
