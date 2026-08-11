"use client";

import { motion } from "framer-motion";

/** Slow-drifting background glow - purely decorative, adds depth to the
 * otherwise static hero without competing for attention. */
export function AmbientBlobs() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,var(--primary)_0%,transparent_70%)] opacity-[0.08]"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[8%] -z-10 size-72 rounded-full bg-primary/10 blur-3xl"
        animate={{ x: [0, 24, 0], y: [0, 30, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-40 left-[6%] -z-10 size-56 rounded-full bg-primary/10 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, -24, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
    </>
  );
}
