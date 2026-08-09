import type { Metadata } from "next";
import { Montserrat, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const bodyFont = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
});

const headingFont = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const monoFont = JetBrains_Mono({
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
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border px-6 py-4 text-xs text-muted-foreground">
            <span>Not investment advice.</span>
            <Link href="/methodology" className="underline underline-offset-4 hover:text-foreground">
              Methodology
            </Link>
            <Link href="/about" className="underline underline-offset-4 hover:text-foreground">
              About
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
