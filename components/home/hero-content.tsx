"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { DemoCompanySummary } from "@/lib/data/demo";
import { SearchBox } from "@/components/search/search-box";
import { staggerContainer, staggerItem } from "@/components/motion/stagger";

export function HeroContent({ companies }: { companies: DemoCompanySummary[] }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.09)}
      className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 text-center"
    >
      <motion.div variants={staggerItem} className="flex flex-col items-center gap-3">
        <Image
          src="/logo-lockup.png"
          alt="Company Labs"
          width={169}
          height={138}
          priority
          unoptimized
          className="h-32 w-auto"
        />
        <p className="text-lg text-muted-foreground">
          Comparable-company valuation multiples, computed from hand-verified SEC filings —
          not AI-generated numbers, not vibes.
        </p>
        <p className="text-sm text-muted-foreground">
          Built for students and early-career analysts learning how equity comps actually work:
          enterprise value, EV/EBITDA, P/E, and where those numbers physically come from in a
          10-K.
        </p>
      </motion.div>

      <motion.div variants={staggerItem} className="w-full">
        <SearchBox companies={companies} />
      </motion.div>

      <motion.div variants={staggerContainer(0.02, 0.1)} className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        <motion.span variants={staggerItem}>Or jump straight to</motion.span>
        {companies.map((c) => (
          <motion.div key={c.ticker} variants={staggerItem}>
            <Link
              href={`/company/${c.ticker}`}
              className="rounded-full border border-border px-3 py-1 transition-colors hover:border-primary/30 hover:bg-accent hover:text-accent-foreground"
            >
              {c.ticker}
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.p variants={staggerItem} className="max-w-md text-xs text-muted-foreground">
        <strong>Disclaimer:</strong> This is a demo product covering a small, hand-verified set
        of companies. Figures are sourced from public SEC filings and market quotes, labelled
        with their source and retrieval date on every card. Nothing here is investment advice.
      </motion.p>
    </motion.div>
  );
}
