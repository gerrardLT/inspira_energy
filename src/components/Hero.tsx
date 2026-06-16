"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView, animate } from "motion/react";

/* ---------- Animated Counter ---------- */
function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;
    const controls = animate(0, target, {
      duration: 2.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setCount(Math.round(v * 10) / 10),
    });
    return () => controls.stop();
  }, [inView, target]);

  return (
    <span ref={ref}>
      {prefix}{count % 1 === 0 ? count : count.toFixed(1)}{suffix}
    </span>
  );
}

/* ---------- Energy-themed Decorative Illustrations ---------- */
function EnergyIllustrations() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Solar panel grid — top right */}
      <motion.svg
        animate={{ opacity: [0.08, 0.16, 0.08] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-8 top-[12%] h-72 w-72"
        viewBox="0 0 300 300"
        fill="none"
      >
        {/* Panel frame */}
        <rect x="60" y="40" width="180" height="140" rx="4" stroke="var(--gold)" strokeWidth="1" opacity="0.7" />
        {/* Grid lines — vertical */}
        {[90, 120, 150, 180, 210].map(x => (
          <line key={x} x1={x} y1="44" x2={x} y2="176" stroke="var(--gold)" strokeWidth="0.5" opacity="0.4" />
        ))}
        {/* Grid lines — horizontal */}
        {[75, 110, 145].map(y => (
          <line key={y} x1="64" y1={y} x2="236" y2={y} stroke="var(--gold)" strokeWidth="0.5" opacity="0.4" />
        ))}
        {/* Support pole */}
        <line x1="150" y1="180" x2="150" y2="240" stroke="var(--gold)" strokeWidth="0.8" opacity="0.4" />
        <line x1="120" y1="240" x2="180" y2="240" stroke="var(--gold)" strokeWidth="0.8" opacity="0.4" />
        {/* Sun rays */}
        <circle cx="260" cy="30" r="12" stroke="var(--gold)" strokeWidth="0.6" opacity="0.3" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <line
            key={angle}
            x1={260 + 16 * Math.cos(angle * Math.PI / 180)}
            y1={30 + 16 * Math.sin(angle * Math.PI / 180)}
            x2={260 + 24 * Math.cos(angle * Math.PI / 180)}
            y2={30 + 24 * Math.sin(angle * Math.PI / 180)}
            stroke="var(--gold)" strokeWidth="0.5" opacity="0.25"
          />
        ))}
      </motion.svg>

      {/* Wind turbine — bottom left */}
      <motion.svg
        className="absolute -left-4 bottom-[18%] h-64 w-64"
        viewBox="0 0 250 250"
        fill="none"
      >
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "125px 90px" }}
        >
          {/* Three blades */}
          <path d="M125 90 L115 30 L130 30Z" fill="var(--teal)" opacity="0.14" />
          <path d="M125 90 L170 125 L160 138Z" fill="var(--teal)" opacity="0.14" />
          <path d="M125 90 L80 125 L90 138Z" fill="var(--teal)" opacity="0.14" />
        </motion.g>
        {/* Hub */}
        <circle cx="125" cy="90" r="4" fill="var(--teal)" opacity="0.2" />
        {/* Tower */}
        <line x1="125" y1="94" x2="125" y2="210" stroke="var(--teal)" strokeWidth="1.2" opacity="0.1" />
        <line x1="105" y1="210" x2="145" y2="210" stroke="var(--teal)" strokeWidth="0.8" opacity="0.06" />
      </motion.svg>

      {/* Battery storage — mid right */}
      <motion.svg
        animate={{ y: [-6, 6, -6] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[8%] bottom-[30%] h-40 w-40"
        viewBox="0 0 160 160"
        fill="none"
      >
        {/* Battery body */}
        <rect x="35" y="40" width="90" height="80" rx="6" stroke="var(--gold)" strokeWidth="0.8" opacity="0.14" />
        {/* Terminal */}
        <rect x="65" y="32" width="30" height="10" rx="2" stroke="var(--gold)" strokeWidth="0.5" opacity="0.06" />
        {/* Charge bars */}
        <rect x="45" y="55" width="16" height="50" rx="2" fill="var(--gold)" opacity="0.04" />
        <rect x="67" y="65" width="16" height="40" rx="2" fill="var(--gold)" opacity="0.03" />
        <rect x="89" y="75" width="16" height="30" rx="2" fill="var(--gold)" opacity="0.02" />
        {/* Lightning bolt */}
        <path d="M78 52 L72 78 L82 78 L76 108" stroke="var(--gold)" strokeWidth="1" opacity="0.15" fill="none" />
      </motion.svg>

      {/* Energy flow lines — connecting elements */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.05]" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="none">
        <path d="M1100 150 Q900 300 400 600" stroke="var(--gold)" strokeWidth="0.8" strokeDasharray="4 8" />
        <path d="M1200 200 Q950 350 350 650" stroke="var(--teal)" strokeWidth="0.6" strokeDasharray="3 6" />
      </svg>

      {/* Small data points */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[20%] top-[25%]"
      >
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-1 rounded-full bg-gold/50" />
          <div className="h-px w-4 bg-gold/20" />
        </div>
      </motion.div>
      <motion.div
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute left-[15%] top-[45%]"
      >
        <div className="flex items-center gap-1.5">
          <div className="h-px w-3 bg-teal/20" />
          <div className="h-1 w-1 rounded-full bg-teal/40" />
        </div>
      </motion.div>
    </div>
  );
}

const STATS = [
  { value: 240, prefix: "$", suffix: "M+", label: "Assets Under Management" },
  { value: 2.7, suffix: " GW", label: "Pipeline Capacity" },
  { value: 28, suffix: "", label: "Active Projects" },
  { value: 4, suffix: "", label: "Continents" },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-[100dvh] overflow-hidden navy-bg noise-overlay">
      {/* Layer 1: Background image with parallax */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -top-[10%]">
        <Image
          src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920&q=80&auto=format"
          alt="Solar panel array at golden hour"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          style={{ opacity: 0.2 }}
        />
      </motion.div>

      {/* Layer 2: Gradient mesh overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/40 to-navy" />
      <div className="absolute inset-0 bg-gradient-to-r from-navy/80 via-transparent to-navy/40" />
      {/* Layer 3: Gold radial glow - bottom center */}
      <div className="absolute bottom-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 translate-y-1/3 rounded-full bg-gold/[0.03] blur-[120px]" />

      {/* Layer 4: Energy-themed decorative illustrations */}
      <EnergyIllustrations />

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity }}
        className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1440px] flex-col justify-end px-6 pb-20 pt-[72px] lg:px-10 lg:pb-28"
      >
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="h-px w-8 bg-gold/60" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold/80">
                Renewable Energy Fund Platform
              </p>
            </div>
            <h1 className="font-heading text-5xl leading-[1.02] tracking-[-0.02em] text-white md:text-6xl lg:text-7xl xl:text-[5.5rem]">
              The smart capital
              <br />
              behind{" "}
              <span
                className="italic"
                style={{
                  background: 'linear-gradient(135deg, var(--gold), oklch(0.80 0.10 85))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                }}
              >clean energy</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 max-w-[52ch] text-lg leading-relaxed text-white/50 lg:text-xl"
          >
            Institutional-grade fund products for solar, storage, and wind.
            From greenfield development to grid-connected operations across
            four continents.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <a
              href="#funds"
              className="group inline-flex h-14 items-center justify-center gap-2.5 bg-accent px-8 text-[13px] font-semibold uppercase tracking-[0.1em] text-navy transition-all duration-300 hover:bg-accent/90 active:-translate-y-[1px]"
            >
              Explore Funds
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#developers"
              className="link-underline inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/60 transition-colors duration-300 hover:text-white"
            >
              For Developers
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </motion.div>
        </div>

        {/* Stats bar with dividers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-20 lg:mt-28"
        >
          {/* Top decorative line */}
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="grid grid-cols-2 gap-x-0 sm:grid-cols-4">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className={`relative py-8 px-6 ${i < STATS.length - 1 ? "border-r border-white/[0.06]" : ""}`}
              >
                <p className="font-heading text-4xl font-light tracking-[-0.02em] text-white lg:text-5xl">
                  <Counter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-white/30">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade to next dark section */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-24 bg-gradient-to-t from-[var(--navy)] to-transparent" />
    </section>
  );
}
