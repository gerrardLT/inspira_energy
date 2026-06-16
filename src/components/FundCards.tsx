"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import {
  Bank,
  ChartLineUp,
  Buildings,
  Lightning,
  ArrowUpRight,
  ArrowRight,
} from "@phosphor-icons/react";

const FUNDS = [
  {
    name: "Debt Fund",
    description:
      "Senior secured lending to renewable energy projects with predictable cash flows and contracted revenue.",
    icon: Bank,
    riskLevel: "Low-Medium",
    targetReturn: "8-12%",
    minTicket: "$5M",
    regions: "SEA, Australia",
    tag: "Fixed Income",
  },
  {
    name: "Equity Fund",
    description:
      "Direct equity stakes in high-growth solar, storage, and wind assets across emerging markets.",
    icon: ChartLineUp,
    riskLevel: "Medium-High",
    targetReturn: "15-22%",
    minTicket: "$10M",
    regions: "SEA, China, Europe",
    tag: "Growth",
  },
  {
    name: "Development Fund",
    description:
      "Greenfield capital for project development, from land acquisition through permitting to construction start.",
    icon: Buildings,
    riskLevel: "High",
    targetReturn: "20-30%",
    minTicket: "$15M",
    regions: "SEA, Australia, China",
    tag: "Development",
  },
  {
    name: "COD Fund",
    description:
      "Acquire and operate commercial-operation-date assets with stable, long-term power purchase agreements.",
    icon: Lightning,
    riskLevel: "Low",
    targetReturn: "6-10%",
    minTicket: "$3M",
    regions: "All Markets",
    tag: "Operational",
  },
];

/* 3D Tilt Card */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });

  function handleMouse(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleLeave() { x.set(0); y.set(0); }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FundCards() {
  return (
    <section id="funds" className="relative overflow-hidden bg-[var(--navy)] py-32 lg:py-40">
      {/* Precision background: subtle data grid */}
      <div className="pointer-events-none absolute inset-0 data-grid-bg opacity-40" />

      {/* Subtle radial glow — top left */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gold/[0.02] blur-[120px]" />

      {/* Subtle radial glow — bottom right */}
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-[400px] w-[400px] rounded-full bg-teal/[0.02] blur-[100px]" />

      {/* Top edge line */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* Header */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-gold/60" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold">
                Fund Products
              </p>
            </div>
            <h2 className="mt-5 font-heading text-4xl leading-[1.08] tracking-[-0.02em] text-white md:text-5xl">
              Four fund products,{" "}
              <span className="italic text-gold">one platform</span>
            </h2>
          </div>
          <div className="flex items-end lg:col-span-7">
            <p className="max-w-[55ch] text-lg leading-relaxed text-white/45">
              Each fund targets a distinct stage of the renewable energy
              lifecycle, letting you align exposure with your risk appetite and
              return expectations.
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-2">
          {FUNDS.map((fund, i) => (
            <motion.div
              key={fund.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 1.0,
                delay: i * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <TiltCard className="group relative h-full overflow-hidden border border-white/[0.06] bg-white/[0.02] p-10 backdrop-blur-[1px] transition-all duration-500 hover:border-gold/20 hover:bg-white/[0.04]">
                {/* Top-right corner: thin accent lines (precision, not organic) */}
                <svg className="absolute right-0 top-0 h-24 w-24 opacity-[0.06] transition-opacity duration-500 group-hover:opacity-[0.12]" viewBox="0 0 96 96" fill="none">
                  <line x1="48" y1="0" x2="96" y2="48" stroke="var(--gold)" strokeWidth="0.5" />
                  <line x1="64" y1="0" x2="96" y2="32" stroke="var(--gold)" strokeWidth="0.3" />
                  <line x1="80" y1="0" x2="96" y2="16" stroke="var(--gold)" strokeWidth="0.3" />
                </svg>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-gold/40 to-transparent transition-all duration-700 group-hover:w-full" />

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center border border-gold/20 bg-gold/[0.06] text-gold">
                      <fund.icon className="h-5 w-5" weight="duotone" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-white">
                        {fund.name}
                      </h3>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                        {fund.tag}
                      </span>
                    </div>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center border border-white/[0.08] transition-all duration-300 group-hover:border-gold/20 group-hover:bg-gold/[0.06]">
                    <ArrowUpRight className="h-3.5 w-3.5 text-white/20 transition-all group-hover:text-gold" />
                  </div>
                </div>

                <p className="mt-6 max-w-[50ch] text-[14px] leading-relaxed text-white/40">
                  {fund.description}
                </p>

                {/* Metrics grid */}
                <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-white/[0.06] pt-7">
                  {([
                    ["Target Return", fund.targetReturn, true],
                    ["Risk Level", fund.riskLevel, false],
                    ["Min. Ticket", fund.minTicket, true],
                    ["Regions", fund.regions, false],
                  ] as [string, string, boolean][]).map(([label, val, mono]) => (
                    <div key={label}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">
                        {label}
                      </p>
                      <p className={`mt-1.5 text-[14px] font-semibold text-white/90 ${mono ? "font-mono text-gold" : ""}`}>
                        {val}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Learn More CTA */}
                <div className="mt-8 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-gold/60 transition-all duration-300 group-hover:text-gold">
                  <span>Learn More</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="mt-10 text-[11px] text-white/20">
          Target returns are indicative only and do not constitute a guarantee.
          Past performance is not a reliable indicator of future results.
        </p>
      </div>
    </section>
  );
}
