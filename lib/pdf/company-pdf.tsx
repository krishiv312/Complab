import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DemoCompany } from "../finance/types";
import { computeCompanyMetrics } from "../finance/compute";
import { formatCurrency, formatMultiple, formatPercent, metricText } from "../format";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#171717" },
  brand: { fontSize: 9, color: "#666666", marginBottom: 4 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#666666", marginBottom: 16 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#666666",
    marginTop: 14,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 4,
  },
  label: { color: "#444444" },
  value: { fontFamily: "Helvetica-Bold" },
  footer: { marginTop: 20, fontSize: 8, color: "#999999", lineHeight: 1.4 },
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function CompanyPdfDocument({ company }: { company: DemoCompany }) {
  const metrics = computeCompanyMetrics(company);
  const current = company.financials[0];
  const periodLabel = `FY${current.period.fiscalYear}`;

  return (
    <Document title={`${company.profile.ticker} - Company Labs`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>COMPANY LABS</Text>
        <Text style={styles.title}>
          {company.profile.name} ({company.profile.ticker})
        </Text>
        <Text style={styles.subtitle}>
          {company.profile.exchange} · {company.profile.sector} · {company.profile.industry}
        </Text>

        <Text style={styles.sectionTitle}>Financial summary — {periodLabel}</Text>
        <Row
          label="Revenue"
          value={
            current.incomeStatement.revenue !== null
              ? formatCurrency(current.incomeStatement.revenue)
              : "N/A"
          }
        />
        <Row label="EBITDA (computed)" value={metricText(metrics.ebitda, formatCurrency)} />
        <Row
          label="Net income"
          value={
            current.incomeStatement.netIncome !== null
              ? formatCurrency(current.incomeStatement.netIncome)
              : "N/A"
          }
        />
        <Row label="Net margin" value={metricText(metrics.margins.netMargin, formatPercent)} />
        <Row label="Revenue growth" value={metricText(metrics.revenueGrowth, formatPercent)} />

        <Text style={styles.sectionTitle}>
          Valuation — as of {company.market.priceAsOf}
        </Text>
        <Row label="Market cap" value={metricText(metrics.marketCap, formatCurrency)} />
        <Row label="Enterprise value" value={metricText(metrics.enterpriseValue, formatCurrency)} />
        <Row label="EV / Revenue" value={metricText(metrics.evRevenue, formatMultiple)} />
        <Row label="EV / EBITDA" value={metricText(metrics.evEbitda, formatMultiple)} />
        <Row label="EV / EBIT" value={metricText(metrics.evEbit, formatMultiple)} />
        <Row label="P / E" value={metricText(metrics.pe, formatMultiple)} />
        <Row label="P / B" value={metricText(metrics.pb, formatMultiple)} />

        <Text style={styles.footer}>
          Source: {current.source.documentUrl ?? "n/a"} · Filed {current.source.filingDate ?? "n/a"}
          {"\n"}
          Retrieved {current.source.retrievedAt}. Figures traced to SEC filings and dated market
          quotes; N/M denotes a computed value not meaningful as a ratio (e.g. a negative
          denominator).
          {"\n"}
          This is a demo product covering a small, hand-verified set of companies. Not investment
          advice.
        </Text>
      </Page>
    </Document>
  );
}
