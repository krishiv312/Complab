"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { motion } from "framer-motion";
import { Menu as MenuIcon, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "/methodology", label: "Methodology" },
  { href: "/privacy", label: "Privacy" },
  { href: "/feedback", label: "Feedback" },
];

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

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-gradient-to-b from-accent/50 to-background/85 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label="Company Labs home">
          <Image src="/logo-icon.png" alt="" width={28} height={14} priority unoptimized className="h-6 w-auto" />
          <span className="font-heading text-sm font-semibold tracking-tight">
            Company Labs
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          <MenuPrimitive.Root open={open} onOpenChange={setOpen}>
            <MenuPrimitive.Trigger
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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
                <MenuPrimitive.Popup className="min-w-40 overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">
                  <motion.div initial="hidden" animate="visible" variants={menuVariants}>
                    {NAV_LINKS.map((link) => (
                      <motion.div key={link.href} variants={itemVariants}>
                        <MenuPrimitive.LinkItem
                          href={link.href}
                          closeOnClick
                          className="block rounded-lg px-3 py-2 text-sm text-foreground transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                        >
                          {link.label}
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
