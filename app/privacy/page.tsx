import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — Company Labs",
  description: "What Company Labs does and doesn't do with your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Privacy notice</h1>
        <p className="text-sm text-muted-foreground">Short, because there isn&apos;t much to say.</p>
      </header>

      <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          <strong className="text-foreground">No accounts, no sign-in.</strong> There is nothing to
          create an account for. Peer group selections for the comps tool are encoded directly in
          the page&apos;s URL, not stored on any server — a link you copy and share is the entire
          persistence mechanism.
        </p>
        <p>
          <strong className="text-foreground">No tracking or analytics.</strong> This site does not
          run any analytics, advertising, or tracking scripts, and sets no cookies of its own. The
          one piece of client-side storage is your light/dark theme preference, kept in your
          browser&apos;s local storage — it never leaves your device.
        </p>
        <p>
          <strong className="text-foreground">Hosting.</strong> The site is hosted on Vercel, which
          — like any hosting provider — receives standard web request logs (IP address, requested
          page, timestamp) as a normal part of serving the site. Company Labs does not access,
          store, or use that data beyond what Vercel retains for basic infrastructure operation.
        </p>
        <p>
          <strong className="text-foreground">The data shown on the site</strong> is public company
          financial information sourced from SEC filings and market data providers — see{" "}
          <a href="/methodology" className="underline underline-offset-4 hover:text-foreground">
            Methodology
          </a>{" "}
          for detail. It is not personal data.
        </p>
        <p>
          Questions about this notice, or anything else, go to the{" "}
          <a href="/feedback" className="underline underline-offset-4 hover:text-foreground">
            feedback page
          </a>
          .
        </p>
      </div>
    </div>
  );
}
