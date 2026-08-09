import Image from "next/image";
import { listDemoCompanySummaries } from "@/lib/data/demo";
import { HeroContent } from "@/components/home/hero-content";

export default function Home() {
  const companies = listDemoCompanySummaries();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-between overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,var(--primary)_0%,transparent_70%)] opacity-[0.08]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[8%] -z-10 size-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 left-[6%] -z-10 size-56 rounded-full bg-primary/10 blur-3xl"
      />

      <HeroContent companies={companies} />

      <Image
        src="/logo-icon.png"
        alt=""
        width={422}
        height={214}
        unoptimized
        className="mt-16 h-10 w-auto opacity-70"
      />
    </div>
  );
}
