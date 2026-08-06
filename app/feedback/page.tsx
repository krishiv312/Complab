import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Feedback — Company Labs",
  description: "Send feedback on Company Labs.",
};

export default function FeedbackPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Found something off?</h1>
      <p className="text-sm text-muted-foreground">
        Wrong number, confusing label, a company that should be here and isn&apos;t — tell me
        directly and I&apos;ll look into it. This is a small, actively-maintained beta, and real
        feedback is the most useful thing anyone can send right now.
      </p>
      <a
        href="mailto:yeetkrishiv@gmail.com?subject=Company%20Labs%20feedback"
        className={cn(buttonVariants({ variant: "default" }), "h-10 px-6")}
      >
        Email feedback
      </a>
    </div>
  );
}
