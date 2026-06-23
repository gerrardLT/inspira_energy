"use client";

import { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Quotes } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

const PRESS_MENTIONS = [
  "Bloomberg NEF",
  "Reuters Energy",
  "PV Magazine",
  "Infrastructure Investor",
];

export function SocialProof() {
  const t = useTranslations("socialProof");
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const TESTIMONIALS = [
    {
      quote: t("testimonial1"),
      author: t("testimonial1Author"),
      title: t("testimonial1Title"),
      type: t("testimonial1Type"),
      image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80&auto=format",
    },
    {
      quote: t("testimonial2"),
      author: t("testimonial2Author"),
      title: t("testimonial2Title"),
      type: t("testimonial2Type"),
      image: "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=600&q=80&auto=format",
    },
  ];

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
    imageRefs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative overflow-hidden bg-[var(--navy-mid)] py-28 lg:py-36">
      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* Press mentions — editorial serif names */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/20 mb-8">
            {t("featuredIn")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {PRESS_MENTIONS.map((outlet, i) => (
              <span
                key={outlet}
                className="font-heading text-lg text-white/20 tracking-wide"
              >
                {outlet}
                {i < PRESS_MENTIONS.length - 1 && (
                  <span className="ml-12 text-white/8 hidden sm:inline">|</span>
                )}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Testimonials — full-width editorial quotes */}
        <div className="space-y-20">
          {TESTIMONIALS.map((testimonial, i) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 1.0,
                delay: i * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-16 items-center"
            >
              {/* Image — editorial accent with Ken Burns reveal */}
              <div
                ref={(el) => { imageRefs.current[i] = el; }}
                className="lg:col-span-4 relative aspect-[4/3] overflow-hidden"
              >
                <img
                  src={testimonial.image}
                  alt=""
                  className="h-full w-full object-cover image-reveal ken-burns"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-[var(--navy-mid)]/30" />
              </div>

              {/* Quote — full-width editorial text */}
              <div className="lg:col-span-8">
                <Quotes className="h-8 w-8 text-gold/20 mb-6 quotes-breathe" weight="duotone" />
                <blockquote className="font-heading text-xl leading-relaxed tracking-tight text-white/70 lg:text-2xl lg:max-w-[50ch] [text-shadow:0_2px_20px_oklch(0_0_0/20%)]">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="mt-8 flex items-center gap-4 group">
                  <div className="h-px w-8 bg-gold/30 transition-all duration-500 group-hover:w-14" />
                  <div>
                    <p className="text-sm font-semibold text-white/70">
                      {testimonial.author}
                    </p>
                    <p className="text-[12px] text-white/30">{testimonial.title}</p>
                  </div>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.2em] text-gold/30">
                    {testimonial.type}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
