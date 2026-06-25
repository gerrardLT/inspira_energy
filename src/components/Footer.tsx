"use client";

import Image from "next/image";
import { Download, Lock, ArrowRight, ShieldCheck, Certificate, Buildings, UsersThree } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("common.footer");

  return (
    <footer className="relative overflow-hidden navy-bg pt-20 pb-12">
      {/* Top decorative gradient line */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
      {/* Ambient glow from top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-gold/[0.03] via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 lg:gap-16">
          {/* Brand — logo only */}
          <div className="md:col-span-4">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="Inspira Energy"
                width={120}
                height={120}
                className="rounded-lg"
              />
            </div>
            <p className="mt-6 max-w-[50ch] text-[13px] leading-relaxed text-white/30">
              {t("brandDesc")}
            </p>
            <p className="mt-3 max-w-[50ch] text-[13px] leading-relaxed text-white/20">
              {t("brandDesc2")}
            </p>
            <div className="mt-8 flex items-center gap-2">
              <div className="h-px w-6 bg-gold/20" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/15">
                {t("singapore")}
              </p>
            </div>
          </div>

          {/* Platform links */}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              {t("platform")}
            </h4>
            <ul className="mt-6 flex flex-col gap-3">
              {[
                { label: t("fundProducts"), href: "/funds" },
                { label: t("globalMarkets"), href: "/markets" },
                { label: t("forDevelopers"), href: "/developers" },
                { label: t("insights"), href: "/insights" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="link-underline text-[13px] text-white/35 transition-colors duration-300 hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              {t("company")}
            </h4>
            <ul className="mt-6 flex flex-col gap-3">
              {[
                { label: t("aboutUs"), href: "/about" },
                { label: t("team"), href: "/about" },
                { label: t("contact"), href: "/contact" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="link-underline text-[13px] text-white/35 transition-colors duration-300 hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Investor Resources */}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              {t("investors")}
            </h4>
            <ul className="mt-6 flex flex-col gap-3">
              <li>
                <a
                  href="#"
                  className="link-underline inline-flex items-center gap-2 text-[13px] text-white/35 transition-colors duration-300 hover:text-white"
                >
                  <Lock className="h-3 w-3" />
                  {t("investorLogin")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="link-underline inline-flex items-center gap-2 text-[13px] text-white/35 transition-colors duration-300 hover:text-white"
                >
                  <Download className="h-3 w-3" />
                  {t("annualReport")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="link-underline inline-flex items-center gap-2 text-[13px] text-white/35 transition-colors duration-300 hover:text-white"
                >
                  <Download className="h-3 w-3" />
                  {t("esgReport")}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              {t("contactLabel")}
            </h4>
            <ul className="mt-6 flex flex-col gap-3">
              <li className="text-[13px] text-white/35">
                info@inspiraenergy.com
              </li>
              <li className="text-[13px] text-white/35">
                +65 (available on request)
              </li>
            </ul>
            <div className="mt-6">
              <Link
                href="/contact"
                className="editorial-link text-white/40 hover:text-white transition-[text-shadow] duration-500 hover:[text-shadow:0_0_16px_oklch(0.70_0.12_78/25%)]"
              >
                {t("getInTouch")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Trust credentials bar */}
        <div className="mt-14 border-t border-white/[0.06] pt-8">
          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            {[
              { icon: ShieldCheck, text: t("masRegulated") },
              { icon: Certificate, text: t("bigFourAudited") },
              { icon: Buildings, text: t("singaporeRegistered") },
              { icon: UsersThree, text: t("lpAdvisoryBoard") },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2.5">
                <item.icon className="h-5 w-5 text-gold/35" weight="duotone" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Legal & regulatory */}
        <div className="mt-8 border-t border-white/[0.04] pt-6">
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <p className="text-[11px] text-white/20">
              {t("copyright")}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <a href="#" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">
                {t("policies")}
              </a>
              <a href="#" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">
                {t("legalDisclaimer")}
              </a>
              <a href="#" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">
                {t("sustainability")}
              </a>
            </div>
            <p className="text-[11px] text-white/20">
              {t("masNote")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
