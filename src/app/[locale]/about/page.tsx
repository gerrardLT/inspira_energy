"use client";

import { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Quotes, Globe, Target, ShieldCheck, Handshake } from "@phosphor-icons/react";

const PARTNERS = [
  "Deloitte", "Clifford Chance", "DBS Bank", "Standard Chartered",
  "Bloomberg NEF", "Wood Mackenzie", "S&P Global", "Bureau Veritas",
];

export default function AboutPage() {
  const t = useTranslations("about");
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

  const TEAM = [
    {
      name: t("weiName"),
      role: t("weiRole"),
      bio: t("weiBio"),
      photo: "/images/team/wei.png",
      tags: [t("weiTag1"), t("weiTag2"), t("weiTag3")],
    },
    {
      name: t("sarahName"),
      role: t("sarahRole"),
      bio: t("sarahBio"),
      photo: "/images/team/sarah.png",
      tags: [t("sarahTag1"), t("sarahTag2"), t("sarahTag3")],
    },
    {
      name: t("davidName"),
      role: t("davidRole"),
      bio: t("davidBio"),
      photo: "/images/team/david.png",
      tags: [t("davidTag1"), t("davidTag2"), t("davidTag3")],
    },
    {
      name: t("mariaName"),
      role: t("mariaRole"),
      bio: t("mariaBio"),
      photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80&auto=format",
      tags: [t("mariaTag1"), t("mariaTag2"), t("mariaTag3")],
    },
    {
      name: t("jamesName"),
      role: t("jamesRole"),
      bio: t("jamesBio"),
      photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80&auto=format",
      tags: [t("jamesTag1"), t("jamesTag2"), t("jamesTag3")],
    },
  ];

  const MILESTONES = [
    { year: t("m1Year"), event: t("m1Event"), desc: t("m1Desc") },
    { year: t("m2Year"), event: t("m2Event"), desc: t("m2Desc") },
    { year: t("m3Year"), event: t("m3Event"), desc: t("m3Desc") },
    { year: t("m4Year"), event: t("m4Event"), desc: t("m4Desc") },
    { year: t("m5Year"), event: t("m5Event"), desc: t("m5Desc") },
    { year: t("m6Year"), event: t("m6Event"), desc: t("m6Desc") },
    { year: t("m7Year"), event: t("m7Event"), desc: t("m7Desc") },
    { year: t("m8Year"), event: t("m8Event"), desc: t("m8Desc") },
  ];

  const VALUES = [
    {
      icon: Globe,
      title: t("vision"),
      desc: t("visionDesc"),
    },
    {
      icon: Target,
      title: t("mission"),
      desc: t("missionDesc"),
    },
    {
      icon: Handshake,
      title: t("values"),
      desc: t("valuesDesc"),
    },
  ];

  const SINGAPORE_ITEMS = [
    { title: t("masTitle"), desc: t("masDesc") },
    { title: t("auditedTitle"), desc: t("auditedDesc") },
    { title: t("gatewayTitle"), desc: t("gatewayDesc") },
    { title: t("advisoryTitle"), desc: t("advisoryDesc") },
  ];

  return (
    <>
      {/* Hero — editorial intro */}
      <section className="relative overflow-hidden bg-[var(--navy-deep)] pt-[120px] pb-28 lg:pt-[140px] lg:pb-36">
        <div className="pointer-events-none absolute inset-0">
          <img
            src="/images/hero-about.png"
            alt=""
            className="h-full w-full object-cover"
            style={{ opacity: 0.7 }}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--navy-deep)]/50 via-[var(--navy-deep)]/70 to-[var(--navy-deep)]" />

        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="max-w-3xl">
            <p className="section-eyebrow text-gold/70 mb-5">{t("heroEyebrow")}</p>
            <h1 className="font-heading text-5xl leading-[1.05] tracking-[-0.02em] text-white md:text-6xl lg:text-7xl">
              {t("heroTitle")}{" "}
              <span className="italic text-gold">{t("heroTitleAccent")}</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="relative bg-[var(--navy)] py-24 lg:py-32">
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="space-y-6">
                <p className="narrative-text text-[15px] text-white/45">{t("story1")}</p>
                <p className="narrative-text text-[15px] text-white/45">{t("story2")}</p>
                <p className="narrative-text text-[15px] text-white/45">{t("story3")}</p>
                <p className="narrative-text text-[15px] text-white/45">{t("story4")}</p>
              </div>
            </div>

            {/* Singapore advantage sidebar */}
            <div className="lg:col-span-5 lg:pl-12 border-l border-white/[0.06]">
              <p className="section-eyebrow text-gold/50 mb-6">{t("whySingapore")}</p>
              <div className="space-y-6">
                {SINGAPORE_ITEMS.map((item) => (
                  <div key={item.title}>
                    <h4 className="text-sm font-semibold text-white/70">{item.title}</h4>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/30">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision / Mission / Values */}
      <section className="relative bg-[var(--navy-mid)] py-24 lg:py-32">
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <p className="section-eyebrow text-gold/60 mb-10">{t("foundationEyebrow")}</p>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="border border-white/[0.06] bg-white/[0.02] p-8"
              >
                <v.icon className="h-7 w-7 text-gold/40 mb-5" weight="duotone" />
                <h3 className="font-heading text-xl tracking-tight text-white/80">{v.title}</h3>
                <p className="mt-4 text-[13px] leading-relaxed text-white/30">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="relative bg-[var(--navy)] py-24 lg:py-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[oklch(0.70_0.12_78/0.04)] via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <p className="section-eyebrow text-accent mb-5">{t("teamEyebrow")}</p>
          <h2 className="font-heading text-4xl leading-[1.08] tracking-[-0.02em] text-white md:text-5xl">
            {t("teamTitle")}{" "}
            <span className="italic text-accent">{t("teamTitleAccent")}</span>
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 1.0, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group"
              >
                <div
                  ref={(el) => { photoRefs.current[i] = el; }}
                  className="relative aspect-[3/4] overflow-hidden bg-muted"
                >
                  <img
                    src={member.photo}
                    alt={`${member.name}, ${member.role}`}
                    className="absolute inset-0 h-full w-full object-cover image-reveal transition-all duration-700 group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-semibold tracking-tight text-white">{member.name}</h3>
                  <p className="mt-1 text-[13px] font-medium text-accent">{member.role}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {member.tags.map((tag) => (
                      <span key={tag} className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20 border border-white/[0.06] px-2 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/30">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Managing Partner Manifesto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="mt-24 border-l-2 border-accent/40 pl-8 lg:pl-12 relative"
          >
            <div className="pointer-events-none absolute -left-px top-0 bottom-0 w-px bg-accent/20 blur-sm" />
            <Quotes className="h-8 w-8 text-accent/30 mb-4 quotes-breathe" weight="duotone" />
            <p className="font-heading text-xl leading-relaxed tracking-tight text-white/80 md:text-2xl lg:max-w-3xl">
              &ldquo;{t("manifesto")}&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-4">
              <div className="h-px w-8 bg-accent/30" />
              <div>
                <p className="text-sm font-semibold text-white">{t("manifestoAuthor")}</p>
                <p className="text-[12px] text-accent/70">{t("manifestoTitle")}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative bg-[var(--navy-mid)] py-24 lg:py-32">
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <p className="section-eyebrow text-gold/60 mb-10">{t("milestonesEyebrow")}</p>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-white/[0.08] md:left-1/2 md:-translate-x-px" />

            <div className="space-y-12">
              {MILESTONES.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative flex gap-8 md:gap-0 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  {/* Dot */}
                  <div className="absolute left-4 top-1 md:left-1/2 md:-translate-x-1/2 z-10">
                    <div className="h-3 w-3 rounded-full border-2 border-accent/50 bg-[var(--navy-mid)]" />
                  </div>

                  {/* Content */}
                  <div className={`pl-12 md:pl-0 md:w-1/2 ${i % 2 === 0 ? "md:pr-16 md:text-right" : "md:pl-16"}`}>
                    <p className="font-heading text-base font-semibold text-accent">{m.year}</p>
                    <h4 className="mt-2 text-base font-semibold text-white/80">{m.event}</h4>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/30 max-w-[40ch] inline-block">{m.desc}</p>
                  </div>
                  <div className="hidden md:block md:w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="relative bg-[var(--navy)] py-24 lg:py-28">
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
          <p className="section-eyebrow text-gold/50 mb-10 text-center">{t("partnersEyebrow")}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8">
            {PARTNERS.map((partner) => (
              <span key={partner} className="font-heading text-lg text-white/15 tracking-wide">
                {partner}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
