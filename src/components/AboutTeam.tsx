"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import Image from "next/image";

const TEAM = [
  {
    name: "Wei Chen",
    role: "Managing Partner",
    trackRecord: "$1.2B deployed across 40+ projects",
    bio: "Previously led APAC clean energy investments at a major Singaporean sovereign fund.",
    photo:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80&auto=format",
  },
  {
    name: "Sarah Lim",
    role: "Head of Investments",
    trackRecord: "Structured 25+ renewable energy deals",
    bio: "Former VP at a global infrastructure bank, specializing in Southeast Asian markets.",
    photo:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80&auto=format",
  },
  {
    name: "David Zhang",
    role: "Director, China Operations",
    trackRecord: "Built 3 GW of solar capacity",
    bio: "Founded two successful EPC companies before joining Inspira to bridge Chinese developers with global capital.",
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

  return (
    <section ref={sectionRef} id="about" className="relative overflow-hidden py-32 lg:py-40">
      {/* Layer 1: Background image — energy infrastructure */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1920&q=80&auto=format"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          style={{ opacity: 0.06 }}
        />
      </div>

      {/* Layer 2: Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />

      {/* Precision decoration: structured vertical lines */}
      <div className="pointer-events-none absolute left-[8%] top-0 h-full w-px bg-gradient-to-b from-transparent via-accent/8 to-transparent hidden lg:block" />
      <div className="pointer-events-none absolute right-[8%] top-0 h-full w-px bg-gradient-to-b from-transparent via-accent/6 to-transparent hidden lg:block" />

      {/* Subtle dot array — top right */}
      <svg className="pointer-events-none absolute right-[5%] top-[10%] h-48 w-48 opacity-[0.06] hidden lg:block" viewBox="0 0 192 192" fill="none">
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 8 }).map((_, col) => (
            <circle key={`${row}-${col}`} cx={col * 24 + 12} cy={row * 24 + 12} r="1" fill="var(--gold)" />
          ))
        )}
      </svg>

      {/* Warm glow — bottom center */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 translate-y-1/2 rounded-full bg-gold/[0.03] blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* Header */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-accent/60" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-accent">
                Our Team
              </p>
            </div>
            <h2 className="mt-5 font-heading text-4xl leading-[1.08] tracking-[-0.02em] text-foreground md:text-5xl">
              Built by operators who{" "}
              <span className="italic text-accent">know the asset class</span>
            </h2>
          </div>
          <div className="flex items-end lg:col-span-7">
            <p className="max-w-[55ch] text-lg leading-relaxed text-muted-foreground">
              Deep energy sector expertise combined with institutional fund
              management experience across Asian and global markets.
            </p>
          </div>
        </div>

        {/* Team Cards */}
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
              {/* Photo container with overlay — irregular top corner */}
              <div className="relative aspect-[4/5] overflow-hidden bg-muted" style={{ clipPath: "polygon(0 3%, 97% 0, 100% 3%, 100% 100%, 0 100%)" }}>
                <Image
                  src={member.photo}
                  alt={`${member.name}, ${member.role} at Inspira Energy`}
                  fill
                  className="object-cover transition-all duration-700 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ filter: "grayscale(60%)" }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />
                {/* Name + role + track record overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 + i * 0.15, duration: 1.0 }}
                  >
                    <div className="h-px w-8 bg-gold/40 mb-3" />
                    <p className="font-mono text-xs text-gold/80 tracking-wide">
                      {member.trackRecord}
                    </p>
                    <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">
                      {member.name}
                    </h3>
                    <p className="mt-1 text-[13px] font-medium text-gold/70">
                      {member.role}
                    </p>
                  </motion.div>
                </div>
                {/* Corner decoration — angular */}
                <div className="absolute top-4 right-4 h-8 w-8">
                  <div className="absolute top-0 right-0 h-px w-4 bg-white/20" />
                  <div className="absolute top-0 right-0 h-4 w-px bg-white/20" />
                </div>
              </div>

              {/* Bio text */}
              <div className="mt-4">
                <p className="text-[14px] leading-relaxed text-muted-foreground">
                  {member.bio}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative mt-28 border-t border-border/40 pt-16">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-px w-8 bg-accent/40" />
            <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
              Company Milestones
            </p>
          </div>

          {/* Connected timeline */}
          <div className="relative grid grid-cols-2 gap-0 md:grid-cols-4">
            {/* Connecting line */}
            <div className="absolute top-[7px] left-0 right-0 h-px bg-border/40 hidden md:block" />

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
                {/* Dot on timeline — diamond shape */}
                <div className="absolute left-0 top-[2px] h-3.5 w-3.5 rotate-45 border-2 border-accent/50 bg-background md:left-1/2 md:-translate-x-1/2">
                  <div className="absolute inset-[3px] bg-accent/30" />
                </div>
                <div className="pt-8 md:pt-8 md:text-center">
                  <p className="font-heading text-base font-semibold text-accent">
                    {m.year}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-foreground/70">
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
