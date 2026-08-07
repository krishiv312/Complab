import type { MetadataRoute } from "next";
import { listDemoTickers } from "@/lib/data/demo";

const BASE_URL = "https://complab-nine.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const tickers = listDemoTickers();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, priority: 1 },
    { url: `${BASE_URL}/methodology`, priority: 0.5 },
    { url: `${BASE_URL}/privacy`, priority: 0.3 },
    { url: `${BASE_URL}/feedback`, priority: 0.3 },
  ];

  const companyRoutes: MetadataRoute.Sitemap = tickers.flatMap((ticker) => [
    { url: `${BASE_URL}/company/${ticker}`, priority: 0.7 },
    { url: `${BASE_URL}/analysis/${ticker}`, priority: 0.7 },
  ]);

  return [...staticRoutes, ...companyRoutes];
}
