"use client";

import { Expand } from "lucide-react";
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
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-foreground/[0.04] transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-heading text-sm font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <Dialog>
          <DialogTrigger
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label={`Expand ${title}`}
          >
            <Expand size={14} />
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
            <div className="mt-4">{children}</div>
          </DialogContent>
        </Dialog>
      </div>
      {children}
      {sourceNote && <p className="text-[11px] text-muted-foreground">{sourceNote}</p>}
    </div>
  );
}
