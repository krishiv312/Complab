"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { MetricValue } from "@/components/company/metric-value";
import type { MetricResult } from "@/lib/finance/types";

const revealUp = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const springReveal = { type: "spring" as const, stiffness: 260, damping: 24 };

export function ReportHero({
  ticker,
  name,
  exchange,
  sector,
  industry,
  price,
  marketCap,
  revenueGrowth,
}: {
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  price: number;
  marketCap: MetricResult;
  revenueGrowth: MetricResult;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const glowScale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);

  return (
    <motion.div
      ref={ref}
      style={{ y, scale, opacity }}
      className="relative flex flex-col items-center gap-8 py-14 text-center sm:py-20"
    >
      <motion.div
        aria-hidden
        style={{ scale: glowScale }}
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--primary)_0%,transparent_70%)] opacity-[0.08]"
        animate={{ opacity: [0.06, 0.11, 0.06] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="flex flex-col items-center gap-3"
      >
        <motion.span
          variants={revealUp}
          transition={springReveal}
          className="rounded-full border border-primary/30 bg-accent px-3 py-1 font-mono text-xs font-semibold text-primary"
        >
          {ticker} · {exchange}
        </motion.span>
        <motion.h1
          variants={revealUp}
          transition={springReveal}
          className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl"
        >
          {name}
        </motion.h1>
        <motion.p variants={revealUp} transition={springReveal} className="text-sm text-muted-foreground">
          {sector} · {industry}
        </motion.p>
        <motion.div variants={revealUp} transition={springReveal}>
          <Link
            href={`/company/${ticker}`}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            View company page
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...springReveal, delay: 0.32 }}
        className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
      >
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Current price
          </span>
          <span className="font-mono text-2xl font-semibold tabular-nums">${price.toFixed(2)}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Market cap
          </span>
          <MetricValue result={marketCap} formatType="currency" size="lg" />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Rev growth
          </span>
          <MetricValue result={revenueGrowth} formatType="percent" size="lg" colorBySign />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="mt-2 flex flex-col items-center gap-1 text-muted-foreground"
      >
        <span className="text-[10px] font-medium tracking-widest uppercase">Scroll to explore</span>
        <motion.span
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
