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
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.4"] });
  const numberY = useTransform(scrollYProgress, [0, 1], [24, -24]);
  const contentY = useTransform(scrollYProgress, [0, 1], [32, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section ref={ref} className="relative flex flex-col gap-6 py-4">
      <motion.span
        aria-hidden
        style={{ y: numberY }}
        className="pointer-events-none absolute -top-4 right-0 hidden font-heading text-8xl leading-none font-bold text-primary/10 select-none sm:block sm:text-9xl"
      >
        {index}
      </motion.span>

      <div className="relative flex max-w-2xl flex-col gap-2 pr-4">
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium tracking-wide text-primary uppercase">
          <span className="size-1.5 rounded-full bg-primary" />
          {eyebrow}
        </span>
        <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        <p className="text-sm text-muted-foreground sm:text-base">{description}</p>
      </div>

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative">
        {children}
      </motion.div>
    </section>
  );
}
