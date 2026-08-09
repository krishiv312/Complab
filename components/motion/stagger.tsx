"use client";

import type { Variants } from "framer-motion";
import { motion } from "framer-motion";

/** Reusable variants - apply directly to any motion.* element that isn't a div. */
export function staggerContainer(stagger = 0.06, delayChildren = 0): Variants {
  return { hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren } } };
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

/** A single staggered-entrance item - for use as a child of StaggerList from a
 * Server Component, which can't import `motion` directly itself. */
export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

/** Convenience wrapper for the common case: a div-based list with staggered children. */
export function StaggerList({
  children,
  className,
  stagger,
  delayChildren,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(stagger, delayChildren)}
      className={className}
    >
      {children}
    </motion.div>
  );
}
