"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StaggerList, staggerItem } from "@/components/motion/stagger";

export interface PeerOption {
  ticker: string;
  name: string;
  rationale?: string;
}

export function PeerPicker({
  subjectTicker,
  currentPeers,
  suggestedPeerTickers,
  suggested,
  others,
}: {
  subjectTicker: string;
  currentPeers: string[];
  suggestedPeerTickers: string[];
  suggested: PeerOption[];
  others: PeerOption[];
}) {
  const router = useRouter();

  function navigate(peers: string[]) {
    const unique = Array.from(new Set(peers));
    const qs = unique.length > 0 ? `?peers=${unique.join(",")}` : "";
    router.push(`/analysis/${subjectTicker}${qs}`);
  }

  function toggle(ticker: string) {
    if (currentPeers.includes(ticker)) {
      navigate(currentPeers.filter((t) => t !== ticker));
    } else {
      navigate([...currentPeers, ticker]);
    }
  }

  function reset() {
    navigate(suggestedPeerTickers);
  }

  const isResetState =
    currentPeers.length === suggestedPeerTickers.length &&
    currentPeers.every((t) => suggestedPeerTickers.includes(t));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Peer group ({currentPeers.length})
        </h2>
        {!isResetState && (
          <button
            type="button"
            onClick={reset}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Reset to suggested
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          Suggested — transparently scored on industry match and revenue-size similarity
        </p>
        <StaggerList className="flex flex-wrap gap-2" stagger={0.03}>
          {suggested.map((p) => {
            const active = currentPeers.includes(p.ticker);
            return (
              <motion.button
                key={p.ticker}
                type="button"
                onClick={() => toggle(p.ticker)}
                title={p.rationale}
                variants={staggerItem}
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.02 }}
                className="group"
              >
                <Badge
                  variant={active ? "default" : "outline"}
                  className="cursor-pointer gap-1.5 px-3 py-1 text-xs"
                >
                  {p.name} ({p.ticker})
                  <span className="text-[10px] opacity-70">{active ? "×" : "+"}</span>
                </Badge>
              </motion.button>
            );
          })}
        </StaggerList>
      </div>

      {others.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Other companies</p>
          <StaggerList className="flex flex-wrap gap-2" stagger={0.015}>
            {others.map((p) => {
              const active = currentPeers.includes(p.ticker);
              return (
                <motion.button
                  key={p.ticker}
                  type="button"
                  onClick={() => toggle(p.ticker)}
                  variants={staggerItem}
                  whileTap={{ scale: 0.94 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Badge
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer gap-1.5 px-3 py-1 text-xs opacity-80"
                  >
                    {p.name} ({p.ticker})
                    <span className="text-[10px] opacity-70">{active ? "×" : "+"}</span>
                  </Badge>
                </motion.button>
              );
            })}
          </StaggerList>
        </div>
      )}
    </div>
  );
}
