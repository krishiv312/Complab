import Image from "next/image";
import { listDemoCompanySummaries } from "@/lib/data/demo";
import { HeroContent } from "@/components/home/hero-content";
import { AmbientBlobs } from "@/components/home/ambient-blobs";

export default function Home() {
  const companies = listDemoCompanySummaries();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-between overflow-hidden px-6 py-16">
      <AmbientBlobs />

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
