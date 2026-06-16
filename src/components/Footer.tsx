"use client";

import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative overflow-hidden navy-bg pt-20 pb-12 noise-overlay">
      {/* Top decorative gradient line */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      {/* Decorative glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.02] blur-[80px]" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 lg:gap-16">
          {/* Brand */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Inspira Energy"
                width={36}
                height={36}
                className="rounded-md"
              />
              <span className="text-base font-semibold tracking-tight text-white">
                Inspira Energy
              </span>
            </div>
            <p className="mt-6 max-w-[40ch] text-[13px] leading-relaxed text-white/30">
              The smart capital behind clean energy. Singapore-registered
              renewable energy fund platform connecting institutional investors
              with developers across four continents.
            </p>
            {/* Decorative element */}
            <div className="mt-8 flex items-center gap-2">
              <div className="h-px w-6 bg-gold/20" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/15">
                Singapore
              </p>
            </div>
          </div>

          {/* Platform links */}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">
              Platform
            </h4>
            <ul className="mt-6 flex flex-col gap-3">
              {[
                { label: "Fund Products", href: "#funds" },
                { label: "Global Markets", href: "#markets" },
                { label: "For Developers", href: "#developers" },
                { label: "Insights", href: "#insights" },
              ].map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="link-underline text-[13px] text-white/45 transition-colors duration-300 hover:text-white"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">
              Company
            </h4>
            <ul className="mt-6 flex flex-col gap-3">
              {[
                { label: "About Us", href: "#about" },
                { label: "Team", href: "#about" },
                { label: "Contact", href: "#contact" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="link-underline text-[13px] text-white/45 transition-colors duration-300 hover:text-white"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">
              Contact
            </h4>
            <ul className="mt-6 flex flex-col gap-3">
              <li className="text-[13px] text-white/45">
                info@inspiraenergy.com
              </li>
              <li className="text-[13px] text-white/45">
                +65 (available on request)
              </li>
            </ul>
            <div className="mt-8">
              <a
                href="#contact"
                className="link-underline inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.1em] text-white/50 transition-colors duration-300 hover:text-white"
              >
                Get in Touch →
              </a>
            </div>
          </div>
        </div>

        {/* Bottom divider and legal */}
        <div className="mt-16 border-t border-white/[0.05] pt-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <p className="text-[11px] text-white/25">
              Inspira Energy Pte Ltd. All rights reserved.
            </p>
            <p className="text-[11px] text-white/25">
              Regulated under the Monetary Authority of Singapore (MAS).
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
