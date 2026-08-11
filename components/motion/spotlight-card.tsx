"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

/** Card wrapper with a cursor-tracked radial glow and a spring lift on hover -
 * the shared "premium" interaction used across metric/chart/summary cards. */
export function SpotlightCard({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof motion.div>, "ref" | "children"> & { children?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(50);
  const rawY = useMotionValue(50);
  const mx = useSpring(rawX, { stiffness: 200, damping: 25 });
  const my = useSpring(rawY, { stiffness: 200, damping: 25 });
  const background = useMotionTemplate`radial-gradient(240px circle at ${mx}% ${my}%, var(--primary) 0%, transparent 65%)`;

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set(((e.clientX - rect.left) / rect.width) * 100);
    rawY.set(((e.clientY - rect.top) / rect.height) * 100);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-foreground/[0.04] transition-shadow duration-300 hover:shadow-lg",
        className
      )}
      {...props}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-[0.08]"
        style={{ background }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
