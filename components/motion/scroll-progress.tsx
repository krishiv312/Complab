"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Slim gradient bar pinned to the very top of the viewport, tracking page
 * scroll position - gives long-form report pages continuous spatial context. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 280, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed top-0 right-0 left-0 z-30 h-[3px] origin-left"
    >
      <div
        className="h-full w-full"
        style={{
          background: "linear-gradient(to right, #3b82f6, #14b8a6, #a855f7, #f97316, #f43f5e)",
        }}
      />
    </motion.div>
  );
}
