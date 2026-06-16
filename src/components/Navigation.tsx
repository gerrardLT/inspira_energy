"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { List, X, ArrowRight } from "@phosphor-icons/react";
import Image from "next/image";

const NAV_ITEMS = [
  { label: "About", href: "#about" },
  { label: "Funds", href: "#funds" },
  { label: "Global Reach", href: "#markets" },
  { label: "For Developers", href: "#developers" },
  { label: "Insights", href: "#insights" },
];

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

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
      <nav className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
        {/* Logo */}
        <motion.a
          href="/"
          className="flex items-center gap-3 group"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative">
            <Image
              src="/logo.png"
              alt="Inspira Energy"
              width={38}
              height={38}
              className="rounded-md"
              priority
            />
            {/* Subtle glow behind logo on scroll */}
            <div className={`absolute inset-0 rounded-md blur-md transition-opacity duration-500 ${scrolled ? 'opacity-0' : 'opacity-100'}`} style={{ background: 'oklch(0.70 0.12 78 / 10%)' }} />
          </div>
          <span
            className={`text-[15px] font-semibold tracking-tight transition-colors duration-500 ${
              scrolled ? "text-foreground" : "text-white"
            }`}
          >
            Inspira Energy
          </span>
        </motion.a>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item, i) => (
            <motion.a
              key={item.href}
              href={item.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative rounded-md px-4 py-2 text-[12px] font-semibold tracking-[0.08em] uppercase transition-colors duration-300 ${
                scrolled
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {item.label}
              {/* Underline indicator */}
              <span className={`absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 transition-all duration-300 group-hover:w-4 ${
                scrolled ? 'bg-accent' : 'bg-white/40'
              }`} />
            </motion.a>
          ))}
        </div>

        {/* Desktop CTA */}
        <motion.div
          className="hidden lg:flex"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <a
            href="#contact"
            className={`group inline-flex h-10 items-center gap-2 rounded-md px-5 text-[12px] font-semibold tracking-[0.08em] uppercase transition-all duration-300 ${
              scrolled
                ? "bg-accent text-navy hover:bg-accent/90 hover:shadow-[0_0_20px_oklch(0.70_0.12_78_/_20%)]"
                : "border border-white/15 text-white/80 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 hover:text-white"
            }`}
          >
            Get in Touch
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </motion.div>

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
              {NAV_ITEMS.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-between rounded-md px-3 py-3.5 text-[14px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {item.label}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-3 border-t border-border/30 pt-4"
              >
                <a
                  href="#contact"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent text-[13px] font-semibold text-navy"
                >
                  Get in Touch
                  <ArrowRight className="h-4 w-4" />
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
