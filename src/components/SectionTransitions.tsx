"use client";

import { motion } from "motion/react";

/**
 * Editorial Section Transitions
 *
 * Clean gradient corridors between sections with subtle light animations.
 * Pure tonal shifts that let the content breathe.
 *
 * - DarkToLight:    Deep navy → light background
 * - LightToDark:    Light background → deep navy
 * - DepthBreath:    Dark-to-dark subtle undulation
 */

/**
 * Dark → Light corridor.
 */
export function DarkToLight() {
  return (
    <div className="relative h-32 w-full overflow-hidden md:h-40">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--navy-deep)] via-[oklch(0.22_0.03_260)] to-[var(--background)]" />
      {/* Thin editorial threshold line with draw animation */}
      <div className="absolute left-0 right-0 top-[45%] h-px bg-gradient-to-r from-transparent via-[oklch(0.70_0.12_78_/_12%)] to-transparent line-draw" />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--background)] to-transparent" />
    </div>
  );
}

/**
 * Light → Dark corridor.
 */
export function LightToDark() {
  return (
    <div className="relative h-32 w-full overflow-hidden md:h-40">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-[oklch(0.22_0.03_260)] to-[var(--navy-deep)]" />
      {/* Thin editorial threshold line with draw animation */}
      <div className="absolute left-0 right-0 top-[55%] h-px bg-gradient-to-r from-transparent via-[oklch(0.54_0.09_172_/_12%)] to-transparent line-draw" />
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[var(--background)] to-transparent" />
    </div>
  );
}

/**
 * Dark → Dark depth breath with subtle opacity pulse.
 */
export function DepthBreath() {
  return (
    <div className="relative h-16 w-full overflow-hidden md:h-20">
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `linear-gradient(to bottom,
            var(--navy) 0%,
            var(--navy-deep) 40%,
            var(--navy-mid) 70%,
            var(--navy) 100%)`,
        }}
      />
    </div>
  );
}
