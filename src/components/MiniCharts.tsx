"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "motion/react";

/* ───────────────────────────────────────────────────
 * SparkLine — SVG line chart with area fill + draw animation
 * ─────────────────────────────────────────────────── */
export function SparkLine({
  data,
  color = "var(--gold)",
  height = 40,
  width = 120,
  areaOpacity = 0.08,
  strokeWidth = 1.2,
  delay = 0,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  areaOpacity?: number;
  strokeWidth?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  // Build SVG path from data points
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padY = 4;
  const usableH = height - padY * 2;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => ({
    x: i * stepX,
    y: padY + usableH - ((v - min) / range) * usableH,
  }));

  // Smooth curve path
  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + stepX * 0.4;
    const cpx2 = p.x - stepX * 0.4;
    return `${acc} C${cpx1} ${prev.y} ${cpx2} ${p.y} ${p.x} ${p.y}`;
  }, "");

  // Area fill path (closed)
  const areaPath = `${linePath} L${width} ${height} L0 ${height} Z`;

  return (
    <div ref={ref} className="pointer-events-none" style={{ width, height }}>
      <svg viewBox={`0 0 ${width} ${height}`} fill="none" className="h-full w-full">
        {/* Area fill */}
        <motion.path
          d={areaPath}
          fill={color}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: areaOpacity } : {}}
          transition={{ duration: 1.5, delay: delay + 0.8 }}
        />
        {/* Line stroke with draw animation */}
        <motion.path
          d={linePath}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={inView ? { pathLength: 1, opacity: 0.6 } : {}}
          transition={{
            duration: 2,
            delay,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
        {/* End dot */}
        {inView && (
          <motion.circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="2"
            fill={color}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.8, scale: 1 }}
            transition={{ delay: delay + 2, duration: 0.4 }}
          />
        )}
      </svg>
    </div>
  );
}

/* ───────────────────────────────────────────────────
 * MiniBarChart — Vertical bars with staggered entrance
 * ─────────────────────────────────────────────────── */
export function MiniBarChart({
  data,
  color = "var(--gold)",
  height = 48,
  barWidth = 6,
  gap = 3,
  delay = 0,
}: {
  data: number[];
  color?: string;
  height?: number;
  barWidth?: number;
  gap?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  const max = Math.max(...data);
  const totalWidth = data.length * (barWidth + gap) - gap;

  return (
    <div
      ref={ref}
      className="flex items-end pointer-events-none"
      style={{ width: totalWidth, height }}
    >
      {data.map((v, i) => {
        const barH = (v / max) * (height - 4);
        return (
          <motion.div
            key={i}
            initial={{ height: 0, opacity: 0 }}
            animate={inView ? { height: barH, opacity: 0.5 } : {}}
            transition={{
              duration: 0.8,
              delay: delay + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="rounded-t-[1px]"
            style={{
              width: barWidth,
              backgroundColor: color,
              marginRight: i < data.length - 1 ? gap : 0,
            }}
          />
        );
      })}
    </div>
  );
}

/* ───────────────────────────────────────────────────
 * LiveTicker — Number oscillates between min and max
 * Simulates real-time data updates
 * ─────────────────────────────────────────────────── */
export function LiveTicker({
  min,
  max,
  suffix = "",
  prefix = "",
  decimals = 1,
  interval = 3000,
  className = "",
}: {
  min: number;
  max: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  interval?: number;
  className?: string;
}) {
  const [value, setValue] = useState((min + max) / 2);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!inView || hasStarted.current) return;
    hasStarted.current = true;

    const controls = animate(min, max, {
      duration: interval / 1000,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "reverse",
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [inView, min, max, interval]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ───────────────────────────────────────────────────
 * FundFlowBar — Decorative "fund flow" animation strip
 * Animated dots traveling along a horizontal gradient bar
 * ─────────────────────────────────────────────────── */
export function FundFlowBar({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-[3px] w-full overflow-hidden ${className}`}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/[0.08] to-transparent" />
      {/* Traveling particles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ x: ["-10%", "110%"] }}
          transition={{
            duration: 4 + i * 1.5,
            repeat: Infinity,
            delay: i * 1.8,
            ease: "linear",
          }}
          className="absolute top-0 h-full w-6"
        >
          <div className="h-full w-full rounded-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </motion.div>
      ))}
    </div>
  );
}
