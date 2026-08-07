import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const monoFont = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const description =
  "Comparable-company valuation multiples, computed from hand-verified SEC filings.";

export const metadata: Metadata = {
  metadataBase: new URL("https://complab-nine.vercel.app"),
  title: {
    default: "Company Labs",
    template: "%s · Company Labs",
  },
  description,
  openGraph: {
    title: "Company Labs",
    description,
    siteName: "Company Labs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Company Labs",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${headingFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-background/80 px-6 py-3 backdrop-blur-md">
            <Link href="/" className="flex items-center gap-2" aria-label="Company Labs home">
              <Image src="/logo-icon.png" alt="" width={28} height={14} priority unoptimized className="h-6 w-auto" />
              <span className="font-heading text-sm font-semibold tracking-tight">
                Company Labs
              </span>
            </Link>
            <ThemeToggle />
          </header>
          <div className="flex flex-1 flex-col">{children}</div>
          <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border px-6 py-4 text-xs text-muted-foreground">
            <span>Not investment advice.</span>
            <Link href="/methodology" className="underline underline-offset-4 hover:text-foreground">
              Methodology
            </Link>
            <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
              Privacy
            </Link>
            <Link href="/feedback" className="underline underline-offset-4 hover:text-foreground">
              Feedback
            </Link>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
