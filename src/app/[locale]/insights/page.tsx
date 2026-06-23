"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, CheckCircle, Download } from "@phosphor-icons/react";

const QUARTERLY_REPORTS_DATA = [
  { quarter: "Q4 2025", dateKey: "Jan 2026" },
  { quarter: "Q3 2025", dateKey: "Oct 2025" },
  { quarter: "Q2 2025", dateKey: "Jul 2025" },
  { quarter: "Q1 2025", dateKey: "Apr 2025" },
];

export default function InsightsPage() {
  const t = useTranslations("insights");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const FEATURED_REPORT = {
    title: t("reportTitle"),
    excerpt: t("reportExcerpt"),
    author: t("reportAuthor"),
    pages: t("reportPages"),
    date: t("reportDate"),
  };

  const ARTICLES = [
    {
      category: t("art1Cat"),
      title: t("art1Title"),
      excerpt: t("art1Excerpt"),
      date: "Dec 2025",
      readTime: "8 min",
      image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80&auto=format",
    },
    {
      category: t("art2Cat"),
      title: t("art2Title"),
      excerpt: t("art2Excerpt"),
      date: "Nov 2025",
      readTime: "5 min",
      image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=80&auto=format",
    },
    {
      category: t("art3Cat"),
      title: t("art3Title"),
      excerpt: t("art3Excerpt"),
      date: "Oct 2025",
      readTime: "12 min",
      image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80&auto=format",
    },
    {
      category: t("art4Cat"),
      title: t("art4Title"),
      excerpt: t("art4Excerpt"),
      date: "Oct 2025",
      readTime: "6 min",
      image: "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=800&q=80&auto=format",
    },
    {
      category: t("art5Cat"),
      title: t("art5Title"),
      excerpt: t("art5Excerpt"),
      date: "Sep 2025",
      readTime: "7 min",
      image: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=800&q=80&auto=format",
    },
    {
      category: t("art6Cat"),
      title: t("art6Title"),
      excerpt: t("art6Excerpt"),
      date: "Aug 2025",
      readTime: "10 min",
      image: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&q=80&auto=format",
    },
    {
      category: t("art7Cat"),
      title: t("art7Title"),
      excerpt: t("art7Excerpt"),
      date: "Jul 2025",
      readTime: "4 min",
      image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80&auto=format",
    },
    {
      category: t("art8Cat"),
      title: t("art8Title"),
      excerpt: t("art8Excerpt"),
      date: "Jun 2025",
      readTime: "9 min",
      image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80&auto=format",
    },
  ];

  const CATEGORY_FILTERS = [t("filterAll"), t("filterMarketAnalysis"), t("filterESG"), t("filterFundUpdates"), t("filterPolicy")];

  const filteredArticles = activeFilter === t("filterAll")
    ? ARTICLES
    : ARTICLES.filter((a) => a.category === activeFilter);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--navy-deep)] pt-[120px] pb-28 lg:pt-[140px] lg:pb-36">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--navy)] via-transparent to-[var(--navy)]" />
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <p className="section-eyebrow text-accent mb-5">{t("heroEyebrow")}</p>
          <h1 className="font-heading text-5xl leading-[1.05] tracking-[-0.02em] text-white md:text-6xl lg:text-7xl max-w-4xl">
            {t("heroTitle")}{" "}
            <span className="italic text-accent">{t("heroTitleAccent")}</span>
          </h1>
          <p className="narrative-text mt-6 text-lg text-white/45 max-w-2xl">
            {t("heroDesc")}
          </p>
        </div>
      </section>

      {/* Featured Report */}
      <section className="relative bg-[var(--navy)] py-20 lg:py-28">
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="relative border border-accent/12 bg-white/[0.02] p-8 lg:p-12 overflow-hidden hover:border-accent/30 transition-all duration-500"
          >
            <div className="light-sweep" />
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{t("featuredReport")}</span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/20">{FEATURED_REPORT.date}</span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white/85 lg:text-2xl max-w-3xl">
              {FEATURED_REPORT.title}
            </h2>
            <p className="mt-4 max-w-[60ch] text-[14px] leading-relaxed text-white/30">{FEATURED_REPORT.excerpt}</p>
            <div className="mt-6 flex items-center gap-4">
              <span className="text-[11px] text-white/25">By {FEATURED_REPORT.author}</span>
              <span className="h-0.5 w-0.5 rounded-full bg-white/20" />
              <span className="text-[11px] text-white/25">{FEATURED_REPORT.pages}</span>
            </div>
            <div className="mt-8">
              <a href="#" className="editorial-link text-accent/50 hover:text-accent">
                <Download className="h-4 w-4" />
                {t("downloadPdf")}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Articles with filter */}
      <section className="relative bg-[var(--navy-mid)] py-20 lg:py-28">
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-12">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`inline-flex h-9 items-center px-4 text-[11px] font-semibold uppercase tracking-[0.15em] transition-all border ${
                  activeFilter === cat
                    ? "border-accent/30 bg-accent/[0.08] text-accent"
                    : "border-white/[0.06] text-white/25 hover:border-white/[0.12] hover:text-white/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Articles grid */}
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article, i) => (
              <motion.article
                key={article.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="group"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={article.image}
                    alt=""
                    className="h-full w-full object-cover ken-burns transition-transform duration-700 group-hover:scale-[1.06]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy-mid)]/80 to-transparent" />
                </div>
                <div className="mt-5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent/50">{article.category}</span>
                  <h3 className="mt-2 text-[15px] font-semibold leading-snug tracking-tight text-white/70 group-hover:text-white/90 transition-colors">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/25 max-w-[50ch]">{article.excerpt}</p>
                  <div className="mt-4 flex items-center gap-3 text-[11px] text-white/20">
                    <span>{article.date}</span>
                    <span className="h-0.5 w-0.5 rounded-full bg-white/15" />
                    <span>{article.readTime} read</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Quarterly Reports Download */}
      <section className="relative bg-[var(--navy)] py-20 lg:py-28">
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <p className="section-eyebrow text-gold/60 mb-5">{t("archiveEyebrow")}</p>
          <h2 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
            {t("archiveTitle")} <span className="italic text-gold">{t("archiveTitleAccent")}</span>
          </h2>

          <div className="mt-10 divide-y divide-white/[0.05]">
            {QUARTERLY_REPORTS_DATA.map((report, i) => (
              <motion.div
                key={report.quarter}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="flex items-center justify-between py-5 group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/40 min-w-[60px]">{report.quarter}</span>
                  <div>
                    <h4 className="text-[14px] font-medium text-white/60 group-hover:text-white/80 transition-colors">{report.quarter}</h4>
                    <p className="text-[11px] text-white/20">{report.dateKey}</p>
                  </div>
                </div>
                <a href="#" className="editorial-link text-gold/40 hover:text-gold text-[12px]">
                  <Download className="h-3.5 w-3.5" />
                  {t("pdf")}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative bg-[var(--navy-deep)] py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/10 to-transparent" />
        <div className="relative z-10 mx-auto max-w-[600px] px-6 lg:px-10 text-center">
          <p className="section-eyebrow text-accent/60 mb-5">{t("newsletterEyebrow")}</p>
          <h2 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
            {t("newsletterTitle")} <span className="italic text-accent">{t("newsletterTitleAccent")}</span>
          </h2>
          <p className="mt-4 text-[14px] text-white/30">
            {t("newsletterDesc")}
          </p>

          {subscribed ? (
            <div className="mt-8 flex items-center justify-center gap-3">
              <CheckCircle className="h-5 w-5 text-teal" weight="duotone" />
              <p className="text-sm text-white/50">{t("subscribed")}</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }}
              className="mt-8 flex gap-2 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 flex-1 border border-white/[0.08] bg-white/[0.03] px-4 text-[14px] text-white outline-none focus:border-accent/40 placeholder:text-white/20"
                placeholder={t("newsletterPlaceholder")}
              />
              <button
                type="submit"
                className="group inline-flex h-12 items-center gap-2 bg-accent px-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy transition-all hover:bg-accent/90"
              >
                {t("subscribe")}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
