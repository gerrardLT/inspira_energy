"use client";

import { motion } from "motion/react";
import {
  Bank,
  ChartLineUp,
  Buildings,
  Lightning,
  ArrowRight,
  ShieldCheck,
} from "@phosphor-icons/react";

const FUNDS = [
  {
    name: "Debt Fund",
    description:
      "Senior secured lending to renewable energy projects with predictable cash flows and contracted revenue.",
    icon: Bank,
    targetReturn: "8-12%",
    tag: "Fixed Income",
    featured: false,
  },
  {
    name: "Equity Fund",
    description:
      "Direct equity stakes in high-growth solar, storage, and wind assets across emerging markets. Our flagship vehicle targets the highest-return opportunities in the renewable energy lifecycle, combining structured capital with on-ground operational expertise.",
    icon: ChartLineUp,
    targetReturn: "15-22%",
    tag: "Growth",
    featured: true,
    image: "/images/funds/equity.png",
    imageAlt: "Aerial view of large-scale solar farm",
  },
  {
    name: "Development Fund",
    description:
      "Greenfield capital for project development, from land acquisition through permitting to construction start.",
    icon: Buildings,
    targetReturn: "20-30%",
    tag: "Development",
    featured: false,
  },
  {
    name: "COD Fund",
    description:
      "Acquire and operate commercial-operation-date assets with stable, long-term power purchase agreements.",
    icon: Lightning,
    targetReturn: "6-10%",
    tag: "Operational",
    featured: false,
  },
];

export function FundCards() {
  const featuredFund = FUNDS.find(f => f.featured)!;
  const otherFunds = FUNDS.filter(f => !f.featured);

  return (
    <section id="funds" className="relative overflow-hidden bg-[var(--navy)] py-32 lg:py-44">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-[600px] w-[600px] rounded-full bg-gold/[0.03] blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* Header — editorial intro */}
        <div className="max-w-3xl">
          <p className="section-eyebrow text-gold mb-5">
            Fund Products
          </p>
          <h2 className="font-heading text-4xl leading-[1.08] tracking-[-0.02em] text-white md:text-5xl">
            Four fund products,{" "}
            <span className="italic text-gold">one platform</span>
          </h2>
          <p className="narrative-text mt-6 text-lg text-white/40">
            Each fund targets a distinct stage of the renewable energy
            lifecycle, letting you align exposure with your risk appetite and
            return expectations.
          </p>
        </div>

        {/* Featured Fund — full-width editorial spread */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left: Full-bleed editorial image with Ken Burns */}
            <div className="lg:col-span-7 relative aspect-[4/3] lg:aspect-auto lg:min-h-[480px] overflow-hidden">
              <img
                src={featuredFund.image}
                alt={featuredFund.imageAlt}
                className="absolute inset-0 h-full w-full object-cover ken-burns"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[var(--navy)] hidden lg:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)] via-transparent to-transparent lg:hidden" />
            </div>

            {/* Right: Narrative content */}
            <div className="lg:col-span-5 flex flex-col justify-center p-8 lg:p-14">
              <p className="section-eyebrow text-gold/50 mb-6">
                {featuredFund.tag}
              </p>
              <h3 className="font-heading text-3xl tracking-[-0.02em] text-white lg:text-4xl">
                {featuredFund.name}
              </h3>
              <p className="narrative-text mt-6 text-[15px] text-white/40">
                {featuredFund.description}
              </p>

              {/* Target return — pull-quote number */}
              <div className="mt-10 pull-quote">
                <p className="font-heading text-5xl font-light tracking-[-0.02em] text-gold glow-breathe">
                  {featuredFund.targetReturn}
                </p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-white/25">
                  Target return
                </p>
              </div>

              <a
                href="#contact"
                className="editorial-link mt-10 text-gold/60 hover:text-gold"
              >
                Explore Fund
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Supporting Funds — editorial narrative strips */}
        <div className="mt-20">
          <div className="editorial-divider mb-10" />
          {otherFunds.map((fund, i) => (
            <motion.div
              key={fund.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 py-8 px-4 -mx-4 rounded-lg transition-all duration-500 hover:bg-white/[0.02] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] ${
                i < otherFunds.length - 1 ? "border-b border-white/[0.05]" : ""
              }`}
            >
              {/* Icon + Name */}
              <div className="flex items-center gap-4 sm:min-w-[200px]">
                <fund.icon className="h-5 w-5 text-gold/40" weight="duotone" />
                <div>
                  <h4 className="text-base font-semibold tracking-tight text-white/80 group-hover:text-white transition-colors">
                    {fund.name}
                  </h4>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20">
                    {fund.tag}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="flex-1 text-[13px] leading-relaxed text-white/30 max-w-[55ch]">
                {fund.description}
              </p>

              {/* Return number */}
              <div className="flex items-center gap-4">
                <p className="font-heading text-2xl font-light tracking-[-0.02em] text-gold/70">
                  {fund.targetReturn}
                </p>
                <ArrowRight className="h-4 w-4 text-white/10 group-hover:text-gold/50 transition-all group-hover:translate-x-0.5" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Regulatory disclosure — footnote level */}
        <div className="mt-16 flex items-start gap-3 opacity-40">
          <ShieldCheck className="h-4 w-4 shrink-0 text-gold/30 mt-0.5" weight="duotone" />
          <p className="text-[10px] leading-relaxed text-white/25">
            Target returns are indicative only and do not constitute a guarantee.
            Past performance is not a reliable indicator of future results. All
            fund products are offered under the regulatory framework of the
            Monetary Authority of Singapore (MAS).
          </p>
        </div>
      </div>
    </section>
  );
}
