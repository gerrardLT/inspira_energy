"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { motion, useScroll, useTransform, useInView, animate } from "motion/react";
import { useTranslations } from "next-intl";

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

export function Hero() {
  const t = useTranslations("hero");
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const STATS = [
    { value: 240, prefix: "$", suffix: "M+", label: t("stat1Label") },
    { value: 2.7, prefix: "", suffix: " GW", label: t("stat2Label") },
    { value: 480, prefix: "", suffix: "K", label: t("stat3Label") },
  ];

  const headings = [t("heading1"), t("heading2"), t("heading3"), t("heading4")];

  return (
    <section ref={sectionRef} className="relative min-h-[100dvh] overflow-hidden bg-[var(--navy-deep)]">
      {/* Layer 1: Full-bleed video with parallax */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -top-[10%]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.85 }}
        >
          <source
            src="/solar_fam_aerial.mp4"
            type="video/mp4"
          />
        </video>
        {/* Slow golden light sweep across hero */}
        <div className="light-sweep" />
      </motion.div>

      {/* Layer 2: Bottom gradient — deepened to 65% for better text contrast */}
      <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-[var(--navy-deep)] via-[var(--navy-deep)]/60 to-transparent" />

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity }}
        className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1440px] flex-col justify-end px-6 pb-20 pt-[72px] lg:px-10 lg:pb-28"
      >
        <div className="max-w-4xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="section-eyebrow text-gold/70 mb-8">
              {t("eyebrow")}
            </p>
          </motion.div>

          {/* Word-by-word reveal heading — magazine headline */}
          <h1 className="font-heading text-5xl leading-[1.05] tracking-[-0.02em] text-white md:text-6xl lg:text-7xl xl:text-[5.5rem]">
            {headings.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, delay: 0.5 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block mr-[0.25em]"
              >
                {word}
              </motion.span>
            ))}
            <br />
            <motion.span
              initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.0, delay: 0.5 + 5 * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block italic pr-2"
              style={{
                background: 'linear-gradient(135deg, var(--gold), oklch(0.80 0.10 85))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              {t("headingAccent")}
            </motion.span>
          </h1>

          {/* Narrative subtext — editorial paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="narrative-text mt-8 text-lg text-white/50 lg:text-xl"
          >
            {t("subtext")}
          </motion.p>

          {/* Single editorial CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10"
          >
            <a
              href="#funds"
              className="editorial-link text-white/60 hover:text-white transition-[text-shadow] duration-500 hover:[text-shadow:0_0_20px_oklch(0.70_0.12_78/30%)]"
            >
              {t("cta")}
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        </div>

        {/* Pull-quote stats — editorial inline numbers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-20 lg:mt-28"
        >
          <div className="editorial-divider mb-12" />
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-0">
            {STATS.map((stat) => (
              <div key={stat.label} className="pull-quote">
                <p className="font-heading text-4xl font-light tracking-[-0.02em] text-white lg:text-5xl glow-breathe">
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

      {/* Bottom gradient fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-32 bg-gradient-to-t from-[var(--navy)] to-transparent" />
    </section>
  );
}
