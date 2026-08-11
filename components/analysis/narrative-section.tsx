"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function NarrativeSection({
  index,
  eyebrow,
  title,
  description,
  children,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.35"] });
  const numberY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const numberScale = useTransform(scrollYProgress, [0, 0.6], [0.85, 1]);
  const numberOpacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);

  const badgeOpacity = useTransform(scrollYProgress, [0, 0.35], [0, 1]);
  const badgeScale = useTransform(scrollYProgress, [0, 0.35], [0.7, 1]);

  const headingY = useTransform(scrollYProgress, [0.05, 0.45], [28, 0]);
  const headingOpacity = useTransform(scrollYProgress, [0.05, 0.45], [0, 1]);

  const descY = useTransform(scrollYProgress, [0.15, 0.55], [20, 0]);
  const descOpacity = useTransform(scrollYProgress, [0.15, 0.55], [0, 1]);

  const contentY = useTransform(scrollYProgress, [0.25, 0.75], [56, 0]);
  const contentScale = useTransform(scrollYProgress, [0.25, 0.75], [0.94, 1]);
  const contentOpacity = useTransform(scrollYProgress, [0.25, 0.7], [0, 1]);
  const contentBlur = useTransform(scrollYProgress, [0.25, 0.65], [8, 0]);
  const contentFilter = useTransform(contentBlur, (v) => `blur(${v}px)`);

  return (
    <section ref={ref} className="relative flex flex-col gap-6 py-4">
      <motion.span
        aria-hidden
        style={{ y: numberY, scale: numberScale, opacity: numberOpacity }}
        className="pointer-events-none absolute -top-4 right-0 hidden font-heading text-8xl leading-none font-bold text-primary/10 select-none sm:block sm:text-9xl"
      >
        {index}
      </motion.span>

      <div className="relative flex max-w-2xl flex-col gap-2 pr-4">
        <motion.span
          style={{ opacity: badgeOpacity, scale: badgeScale }}
          className="flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium tracking-wide text-primary uppercase"
        >
          <span className="size-1.5 rounded-full bg-primary" />
          {eyebrow}
        </motion.span>
        <motion.h2
          style={{ y: headingY, opacity: headingOpacity }}
          className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
        >
          {title}
        </motion.h2>
        <motion.p style={{ y: descY, opacity: descOpacity }} className="text-sm text-muted-foreground sm:text-base">
          {description}
        </motion.p>
      </div>

      <motion.div
        style={{ y: contentY, scale: contentScale, opacity: contentOpacity, filter: contentFilter }}
        className="relative"
      >
        {children}
      </motion.div>
    </section>
  );
}
