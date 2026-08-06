import { notFound } from "next/navigation";
import { getDemoCompany } from "@/lib/data/demo";
import { buildCompsCsv } from "@/lib/csv";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const company = getDemoCompany(ticker);
  if (!company) {
    notFound();
  }

  const url = new URL(request.url);
  const peersParam = url.searchParams.get("peers") ?? "";
  const peers = peersParam
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter((t) => t && t !== company.profile.ticker)
    .map((t) => getDemoCompany(t))
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const csv = buildCompsCsv(company, peers);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${company.profile.ticker}-comps.csv"`,
    },
  });
}
