import { notFound } from "next/navigation";
import { getDemoCompany } from "@/lib/data/demo";
import { buildCompanyCsv } from "@/lib/csv";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const company = getDemoCompany(ticker);

  if (!company) {
    notFound();
  }

  const csv = buildCompanyCsv(company);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${company.profile.ticker}-company-labs.csv"`,
    },
  });
}
