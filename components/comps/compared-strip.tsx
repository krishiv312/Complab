import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ComparedStrip({
  subjectTicker,
  peers,
  editHref,
}: {
  subjectTicker: string;
  peers: { ticker: string }[];
  editHref: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-foreground/[0.04]">
      <div className="flex flex-col">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Compared</span>
        <span className="text-sm text-muted-foreground">{peers.length + 1} companies</span>
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full border border-primary bg-accent px-3 py-1 font-mono text-xs font-medium text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          {subjectTicker}
          <span className="text-[10px] font-sans font-normal opacity-70">SUBJECT</span>
        </span>
        {peers.map((p) => (
          <span
            key={p.ticker}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-mono text-xs text-foreground"
          >
            <span className="size-1.5 rounded-full bg-muted-foreground" />
            {p.ticker}
          </span>
        ))}
      </div>

      <Link href={editHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
        <Plus size={13} />
        Edit selection
      </Link>
    </div>
  );
}
