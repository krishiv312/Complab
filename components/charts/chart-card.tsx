"use client";

import { useRef } from "react";
import { Expand } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ChartCard({
  title,
  description,
  sourceNote,
  children,
}: {
  title: string;
  description?: string;
  sourceNote?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(50);
  const rawY = useMotionValue(50);
  const mx = useSpring(rawX, { stiffness: 200, damping: 25 });
  const my = useSpring(rawY, { stiffness: 200, damping: 25 });
  const background = useMotionTemplate`radial-gradient(280px circle at ${mx}% ${my}%, var(--primary) 0%, transparent 65%)`;

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set(((e.clientX - rect.left) / rect.width) * 100);
    rawY.set(((e.clientY - rect.top) / rect.height) * 100);
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <motion.div
            ref={ref}
            onMouseMove={handleMove}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 350, damping: 24 }}
            aria-label={`Expand ${title}`}
            className="group relative flex w-full cursor-zoom-in flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 text-left shadow-sm ring-1 ring-foreground/[0.04] transition-shadow duration-300 hover:shadow-lg hover:ring-primary/15"
          />
        }
        nativeButton={false}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-[0.08]"
          style={{ background }}
        />
        <div className="relative flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <h3 className="font-heading text-sm font-semibold">{title}</h3>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <span className="flex size-7 shrink-0 translate-x-1 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
            <Expand size={14} />
          </span>
        </div>
        <div className="relative">{children}</div>
        {sourceNote && <p className="relative text-[11px] text-muted-foreground">{sourceNote}</p>}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
        <div className="mt-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
