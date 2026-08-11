"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { DemoCompanySummary } from "@/lib/data/demo";
import { SearchBox } from "@/components/search/search-box";
import { staggerContainer, staggerItem } from "@/components/motion/stagger";

// One flagship ticker per industry the dataset covers (footwear & apparel,
// semiconductors, enterprise software, food & beverage) - a representative
// sample rather than an arbitrary slice. Everything else is a search away.
const QUICK_ACCESS_TICKERS = ["NKE", "NVDA", "CRM", "KO"];

export function HeroContent({ companies }: { companies: DemoCompanySummary[] }) {
  const quickAccess = QUICK_ACCESS_TICKERS.map((ticker) =>
    companies.find((c) => c.ticker === ticker)
  ).filter((c): c is DemoCompanySummary => c !== undefined);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.09)}
      className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 text-center"
    >
      <motion.div variants={staggerItem} className="flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.05 }}
          >
            <Image
              src="/logo-icon.png"
              alt=""
              width={422}
              height={214}
              priority
              unoptimized
              className="h-14 w-auto"
            />
          </motion.div>
          <span className="font-heading text-2xl font-semibold tracking-tight whitespace-nowrap sm:text-4xl">
            Company Labs
          </span>
        </div>
        <p className="text-lg text-muted-foreground">
          Comparable-company valuation multiples, computed from{" "}
          <span className="text-primary">hand-verified SEC filings</span> — not AI-generated
          numbers, not vibes.
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

      <motion.div variants={staggerContainer(0.02, 0.1)} className="flex flex-col items-center gap-3">
        <motion.span
          variants={staggerItem}
          className="text-xs font-medium tracking-wider text-muted-foreground uppercase"
        >
          Or jump straight to
        </motion.span>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          {quickAccess.map((c) => (
            <motion.div
              key={c.ticker}
              variants={staggerItem}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Link
                href={`/company/${c.ticker}`}
                className="block rounded-full border border-border px-3 py-1 font-mono transition-colors hover:border-primary/30 hover:bg-accent hover:text-accent-foreground hover:shadow-md"
              >
                {c.ticker}
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.p variants={staggerItem} className="max-w-md text-xs text-muted-foreground">
        <strong>Disclaimer:</strong> This is a demo product covering a small, hand-verified set
        of companies. Figures are sourced from public SEC filings and market quotes, labelled
        with their source and retrieval date on every card. Nothing here is investment advice.
      </motion.p>
    </motion.div>
  );
}
