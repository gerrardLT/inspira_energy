/**
 * Capital Clarity — Section Transitions
 *
 * Design philosophy: Transitions serve the content, they are not content themselves.
 * Simple CSS gradients (40-60px) replace the elaborate "corridor" components.
 *
 * - DarkToDark: Subtle tonal shift (navy → navy-mid → navy), no extra component needed
 * - DarkToLight: Clean gradient fade (navy → background)
 * - LightToDark: Clean gradient fade (background → navy)
 */

/**
 * Dark → Light transition.
 * Used between dark sections (Hero/FundCards/GlobalMarkets/ForDevelopers/Insights)
 * and the light AboutTeam section.
 */
export function DarkToLight() {
  return (
    <div className="relative h-12 w-full overflow-hidden md:h-16">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--navy)] via-[oklch(0.22_0.03_260)] to-[var(--background)]" />
      {/* Subtle gold threshold line */}
      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[oklch(0.70_0.12_78_/_12%)] to-transparent" />
    </div>
  );
}

/**
 * Light → Dark transition.
 * Used between the light AboutTeam section and dark Insights section.
 */
export function LightToDark() {
  return (
    <div className="relative h-12 w-full overflow-hidden md:h-16">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-[oklch(0.22_0.03_260)] to-[var(--navy)]" />
      {/* Subtle teal threshold line */}
      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[oklch(0.54_0.09_172_/_12%)] to-transparent" />
    </div>
  );
}

/**
 * Dark → Dark subtle separator.
 * A thin tonal shift between two dark sections (e.g. GlobalMarkets → ForDevelopers).
 * Only 24-32px tall — barely noticeable but prevents visual merging.
 */
export function DarkSeparator() {
  return (
    <div className="relative h-6 w-full overflow-hidden md:h-8">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--navy)] via-[var(--navy-mid)] to-[var(--navy)]" />
      {/* Thin gold line at center */}
      <div className="absolute left-1/2 top-1/2 h-px w-16 -translate-x-1/2 -translate-y-1/2 bg-[oklch(0.70_0.12_78_/_15%)]" />
    </div>
  );
}
