"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { motion } from "framer-motion";
import { Menu as MenuIcon, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "/", label: "Home", description: "Search the universe", dot: "bg-blue-500" },
  { href: "/methodology", label: "Methodology", description: "How the multiples are built", dot: "bg-teal-500" },
  { href: "/about", label: "About", description: "The Company Labs story", dot: "bg-purple-500" },
  { href: "/privacy", label: "Privacy", description: "How your data is handled", dot: "bg-orange-500" },
  { href: "/feedback", label: "Feedback", description: "Tell us what's broken", dot: "bg-rose-500" },
];

const SUBTITLES: { match: (path: string) => boolean; label: string }[] = [
  { match: (p) => p.startsWith("/company/"), label: "Company detail" },
  { match: (p) => /^\/analysis\/[^/]+\/compare/.test(p), label: "Build a comparison" },
  { match: (p) => p.startsWith("/analysis/"), label: "Valuation workspace" },
];
const DEFAULT_SUBTITLE = "Valuation workspace";

const menuVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" as const } },
};

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const subtitle = SUBTITLES.find((s) => s.match(pathname))?.label ?? DEFAULT_SUBTITLE;

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-gradient-to-b from-accent/50 to-background/85 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label="Company Labs home">
          <Image src="/logo-icon.png" alt="" width={28} height={14} priority unoptimized className="h-6 w-auto" />
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-sm font-semibold tracking-tight">Company Labs</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {subtitle}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          <MenuPrimitive.Root open={open} onOpenChange={setOpen}>
            <MenuPrimitive.Trigger
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground ring-1 ring-primary/40 transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <motion.span
                animate={{ rotate: open ? 90 : 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex"
              >
                {open ? <X size={16} /> : <MenuIcon size={16} />}
              </motion.span>
            </MenuPrimitive.Trigger>
            <MenuPrimitive.Portal>
              <MenuPrimitive.Positioner side="bottom" align="end" sideOffset={10}>
                <MenuPrimitive.Popup className="w-64 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
                  <div
                    className="h-[3px] w-full"
                    style={{
                      background:
                        "linear-gradient(to right, #3b82f6, #14b8a6, #a855f7, #f97316, #f43f5e)",
                    }}
                  />
                  <motion.div initial="hidden" animate="visible" variants={menuVariants} className="p-1.5">
                    {NAV_LINKS.map((link) => (
                      <motion.div key={link.href} variants={itemVariants}>
                        <MenuPrimitive.LinkItem
                          href={link.href}
                          closeOnClick
                          className="flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                        >
                          <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${link.dot}`} />
                          <span className="flex flex-col">
                            <span className="font-medium">{link.label}</span>
                            <span className="text-xs text-muted-foreground">{link.description}</span>
                          </span>
                        </MenuPrimitive.LinkItem>
                      </motion.div>
                    ))}
                  </motion.div>
                </MenuPrimitive.Popup>
              </MenuPrimitive.Positioner>
            </MenuPrimitive.Portal>
          </MenuPrimitive.Root>
        </div>
      </div>
    </header>
  );
}
