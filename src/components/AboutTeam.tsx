"use client";

import { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Quotes } from "@phosphor-icons/react";

const TEAM = [
  {
    name: "Wei Chen",
    role: "Managing Partner",
    bio: "Previously led APAC clean energy investments at a major Singaporean sovereign fund. $1.2B deployed across 40+ projects.",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format",
  },
  {
    name: "Sarah Lim",
    role: "Head of Investments",
    bio: "Former VP at a global infrastructure bank, specializing in Southeast Asian markets. Structured 25+ renewable energy deals.",
    photo:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80&auto=format",
  },
  {
    name: "David Zhang",
    role: "Director, China Operations",
    bio: "Founded two successful EPC companies before joining Inspira to bridge Chinese developers with global capital. Built 3 GW of solar capacity.",
    photo:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80&auto=format",
  },
];

const MILESTONES = [
  { year: "2023", event: "Founded in Singapore" },
  { year: "2024 Q1", event: "First fund launched, $80M AUM" },
  { year: "2024 Q3", event: "Expanded to Australia and China" },
  { year: "2025", event: "European pipeline initiated" },
];

export function AboutTeam() {
  const sectionRef = useRef<HTMLElement>(null);
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelector("img")?.classList.add("revealed");
          }
        });
      },
      { threshold: 0.3 }
    );
    photoRefs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="about" className="relative overflow-hidden py-32 lg:py-44">
      {/* Warm glow from above */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[oklch(0.70_0.12_78/0.04)] via-transparent to-transparent" />

      {/* Background image — subtle energy infrastructure */}
      <div className="pointer-events-none absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1920&q=80&auto=format"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.04 }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* Header */}
        <div className="max-w-3xl">
          <p className="section-eyebrow text-accent mb-5">
            Our Team
          </p>
          <h2 className="font-heading text-4xl leading-[1.08] tracking-[-0.02em] text-foreground md:text-5xl">
            Built by operators who{" "}
            <span className="italic text-accent">know the asset class</span>
          </h2>
          <p className="narrative-text mt-6 text-lg text-muted-foreground">
            Deep energy sector expertise combined with institutional fund
            management experience across Asian and global markets.
          </p>
        </div>

        {/* Team Cards — clean editorial portraits */}
        <div className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-3">
          {TEAM.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 1.0,
                delay: i * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group"
            >
              {/* Photo — clean rectangle with reveal animation */}
              <div
                ref={(el) => { photoRefs.current[i] = el; }}
                className="relative aspect-[3/4] overflow-hidden bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.photo}
                  alt={`${member.name}, ${member.role} at Inspira Energy`}
                  className="absolute inset-0 h-full w-full object-cover image-reveal transition-all duration-700 group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
              </div>

              {/* Name + role + bio below photo */}
              <div className="mt-5">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {member.name}
                </h3>
                <p className="mt-1 text-[13px] font-medium text-accent">
                  {member.role}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                  {member.bio}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Managing Partner Manifesto with glow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="mt-24 border-l-2 border-accent/40 pl-8 lg:pl-12 relative"
        >
          <div className="pointer-events-none absolute -left-px top-0 bottom-0 w-px bg-accent/20 blur-sm" />
          <Quotes className="h-8 w-8 text-accent/30 mb-4 quotes-breathe" weight="duotone" />
          <p className="font-heading text-xl leading-relaxed tracking-tight text-foreground/80 md:text-2xl lg:max-w-3xl [text-shadow:0_2px_16px_oklch(0_0_0/8%)]">
            &ldquo;We don&rsquo;t just invest in projects — we invest in the operators
            behind them. Our role is to bridge the gap between institutional
            capital and the people building the energy transition on the ground.&rdquo;
          </p>
          <div className="mt-6 flex items-center gap-4 group">
            <div className="h-px w-8 bg-accent/30 transition-all duration-500 group-hover:w-14" />
            <div>
              <p className="text-sm font-semibold text-foreground">Wei Chen</p>
              <p className="text-[12px] text-accent/70">Managing Partner, Inspira Energy</p>
            </div>
          </div>
        </motion.div>

        {/* Timeline — clean editorial */}
        <div className="relative mt-28 border-t border-border/30 pt-16">
          <p className="section-eyebrow text-muted-foreground/50 mb-10">
            Company Milestones
          </p>

          <div className="relative grid grid-cols-2 gap-0 md:grid-cols-4">
            {/* Connecting line with draw animation */}
            <div className="absolute top-[5px] left-0 right-0 h-px bg-border/30 hidden md:block line-draw" />

            {MILESTONES.map((m, i) => (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: i * 0.15,
                  duration: 1.0,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative pl-8 md:pl-0"
              >
                {/* Dot on timeline with scale bounce */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 + 0.3, duration: 0.5, type: "spring", stiffness: 300 }}
                  className="absolute left-0 top-[1px] h-2.5 w-2.5 rounded-full border-2 border-accent/50 bg-background md:left-1/2 md:-translate-x-1/2"
                />
                <div className="pt-8 md:pt-8 md:text-center">
                  <p className="font-heading text-base font-semibold text-accent">
                    {m.year}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-foreground/60">
                    {m.event}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
