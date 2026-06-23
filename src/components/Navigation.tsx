"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useTransform } from "motion/react";
import { List, X, ArrowRight } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

export function Navigation() {
  const t = useTranslations("common.nav");
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as string) || "zh";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(latest > 60);
    // Hide on scroll down, show on scroll up
    if (latest > previous && latest > 200) {
      setHidden(true);
      setMobileOpen(false);
    } else {
      setHidden(false);
    }
  });

  const navItems = [
    { label: t("about"), href: "/about" },
    { label: t("funds"), href: "/funds" },
    { label: t("globalReach"), href: "/markets" },
    { label: t("forDevelopers"), href: "/developers" },
    { label: t("insights"), href: "/insights" },
  ];

  const switchLocale = () => {
    const newLocale = currentLocale === "zh" ? "en" : "zh";
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <motion.header
      animate={{ y: hidden ? -100 : 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-border/20 bg-white/80 shadow-[0_4px_30px_rgba(0,0,0,0.06)] backdrop-blur-2xl"
          : "bg-transparent"
      }`}
    >
      {/* Scroll progress bar — gold to teal gradient */}
      <motion.div
        style={{ scaleX: progressWidth }}
        className="scroll-progress"
      />
      <nav className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
        {/* Left nav items */}
        <div className="hidden items-center gap-1 lg:flex">
          {navItems.slice(0, 3).map((item, i) => (
            <motion.div key={item.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={item.href}
                className={`group relative rounded-md px-4 py-2 text-[12px] font-semibold tracking-[0.08em] uppercase transition-colors duration-300 ${
                  scrolled
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {item.label}
                <span className={`absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 transition-all duration-300 group-hover:w-4 ${
                  scrolled ? 'bg-accent' : 'bg-white/40'
                }`} />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Center — bold text-only masthead */}
        <Link href="/" className="group relative overflow-visible">
          <motion.div
            className="flex flex-col items-center leading-none overflow-visible"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.span
              className="relative whitespace-nowrap pr-1 font-heading text-[36px] font-light italic tracking-[-0.02em] md:text-[40px]"
              style={{
                background: 'linear-gradient(135deg, oklch(0.85 0.12 85), oklch(0.75 0.14 75), oklch(0.90 0.08 90))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              Inspira
              <motion.span
                className="absolute -bottom-[2px] left-0 h-[2px] w-0 rounded-full bg-gradient-to-r from-[oklch(0.70_0.12_78)] to-[oklch(0.80_0.10_85)] transition-all duration-500 ease-out group-hover:w-full"
              />
            </motion.span>
            <motion.span
              className={`mt-[3px] text-[11px] font-semibold tracking-[0.45em] uppercase transition-all duration-300 ${
                scrolled ? "text-accent/80" : "text-accent/65"
              } group-hover:tracking-[0.55em]`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              Energy
            </motion.span>
          </motion.div>
        </Link>

        {/* Right nav items + CTA + Locale Switcher */}
        <div className="hidden items-center gap-1 lg:flex">
          {navItems.slice(3).map((item, i) => (
            <motion.div key={item.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + (i + 3) * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={item.href}
                className={`group relative rounded-md px-4 py-2 text-[12px] font-semibold tracking-[0.08em] uppercase transition-colors duration-300 ${
                  scrolled
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {item.label}
                <span className={`absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 transition-all duration-300 group-hover:w-4 ${
                  scrolled ? 'bg-accent' : 'bg-white/40'
                }`} />
              </Link>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="ml-3"
          >
            <Link
              href="/contact"
              className={`group inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.08em] uppercase transition-all duration-300 ${
                scrolled
                  ? "text-foreground hover:text-accent"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {t("contact")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Language Switcher */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            onClick={switchLocale}
            className={`ml-3 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-300 ${
              scrolled
                ? "border-border/30 text-muted-foreground hover:border-accent hover:text-accent"
                : "border-white/15 text-white/40 hover:border-white/30 hover:text-white/70"
            }`}
            aria-label="Switch language"
          >
            {currentLocale === "zh" ? "EN" : "中文"}
          </motion.button>
        </div>

        {/* Mobile Toggle */}
        <motion.button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`relative flex h-10 w-10 items-center justify-center rounded-md lg:hidden transition-colors ${
            scrolled ? "text-foreground" : "text-white"
          }`}
          aria-label="Toggle menu"
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mobileOpen ? "close" : "open"}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <List className="h-5 w-5" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border/20 bg-white/95 backdrop-blur-2xl lg:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-5">
              {navItems.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-md px-3 py-3.5 text-[14px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <motion.span
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {item.label}
                  </motion.span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                </Link>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-3 border-t border-border/30 pt-4"
              >
                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent text-[13px] font-semibold text-navy"
                >
                  {t("getStarted")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>

              {/* Mobile Language Switcher */}
              <button
                onClick={() => { switchLocale(); setMobileOpen(false); }}
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-md border border-border/30 text-[12px] font-semibold uppercase tracking-[0.15em] text-foreground/60 hover:border-accent hover:text-accent transition-all"
              >
                {currentLocale === "zh" ? "English" : "中文"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
