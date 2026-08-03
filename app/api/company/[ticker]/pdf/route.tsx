import { notFound } from "next/navigation";
import { renderToBuffer } from "@react-pdf/renderer";
import { getDemoCompany } from "@/lib/data/demo";
import { CompanyPdfDocument } from "@/lib/pdf/company-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const company = getDemoCompany(ticker);

  if (!company) {
    notFound();
  }

  const buffer = await renderToBuffer(<CompanyPdfDocument company={company} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${company.profile.ticker}-company-labs.pdf"`,
    },
  });
}
