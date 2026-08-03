import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
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

export const metadata: Metadata = {
  title: "Company Labs",
  description:
    "Comparable-company valuation multiples, computed from hand-verified SEC filings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-10 flex items-center border-b border-border/70 bg-background/80 px-6 py-3 backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2" aria-label="Company Labs home">
            <Image src="/logo-icon.png" alt="" width={28} height={14} priority className="h-6 w-auto" />
            <span className="font-heading text-sm font-semibold tracking-tight">
              Company Labs
            </span>
          </Link>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
