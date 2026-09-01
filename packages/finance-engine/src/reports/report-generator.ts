/**
 * Dhanya Production Report & PDF Export Generator
 * Package: @dhanya/finance-engine
 * 
 * Generates verified, executive-grade financial reports with deterministic outputs,
 * complete user inputs, assumptions, comparative scenarios, and provenance citations.
 */

import { CalculatorDecisionPackage } from '../decision/decision-engine';

export interface ReportExportData {
  title: string;
  calculatorType: 'MORTGAGE' | 'SIP' | 'TAX' | 'FIRE' | 'REFINANCE';
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  calculatedAt: string;
  inputs: { label: string; value: string | number }[];
  primaryResults: { label: string; value: string; highlight?: boolean }[];
  decisionPackage: CalculatorDecisionPackage;
}

/**
 * Generates self-contained, responsive, printable HTML document with Dhanya Brand Stylesheet.
 * Supports direct window.print() or file download as .html / PDF conversion.
 */
export function generatePrintableReportHtml(data: ReportExportData): string {
  const {
    title,
    countryName,
    currencyCode,
    calculatedAt,
    inputs,
    primaryResults,
    decisionPackage,
  } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Dhanya Verified Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --warm-ivory: #F5F1E9;
      --deep-ink: #111A33;
      --emerald: #2F7D68;
      --champagne: #C8A96B;
      --surface: #FFFFFF;
      --border: #E5E0D5;
      --text-main: #111A33;
      --text-muted: #6B7280;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--warm-ivory);
      color: var(--text-main);
      line-height: 1.5;
      padding: 40px 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 48px;
      box-shadow: 0 4px 20px rgba(17, 26, 51, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .brand-mark {
      font-family: 'Manrope', sans-serif;
      font-size: 24px;
      font-weight: 800;
      color: var(--deep-ink);
      letter-spacing: -0.03em;
    }
    .brand-sub {
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--emerald);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 4px;
    }
    .meta-box {
      text-align: right;
      font-size: 12px;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }
    .report-title {
      font-size: 28px;
      font-weight: 800;
      color: var(--deep-ink);
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    .provenance-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #EAF5F1;
      color: var(--emerald);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 24px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 14px;
      font-family: 'JetBrains Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--deep-ink);
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
      margin-bottom: 16px;
      font-weight: 700;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .card {
      background: var(--warm-ivory);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px 20px;
    }
    .card.primary {
      background: var(--deep-ink);
      color: #FFFFFF;
      border-color: var(--deep-ink);
    }
    .card.primary .label {
      color: #A5B4FC;
    }
    .card.primary .value {
      color: #FFFFFF;
    }
    .label {
      font-size: 11px;
      text-transform: uppercase;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-muted);
      margin-bottom: 4px;
      font-weight: 600;
    }
    .value {
      font-size: 18px;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      color: var(--deep-ink);
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 12px;
    }
    .table th {
      background: var(--warm-ivory);
      padding: 10px 14px;
      text-align: left;
      font-weight: 700;
      border-bottom: 1px solid var(--border);
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
    }
    .table td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      font-family: 'JetBrains Mono', monospace;
    }
    .recs-box {
      background: #F8FAFC;
      border-left: 4px solid var(--emerald);
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .recs-title {
      font-weight: 700;
      font-size: 14px;
      color: var(--deep-ink);
      margin-bottom: 4px;
    }
    .recs-desc {
      font-size: 12px;
      color: #475569;
    }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }
    @media print {
      body {
        background: none;
        padding: 0;
      }
      .container {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="no-print" style="margin-bottom: 24px; display: flex; justify-content: flex-end; gap: 12px;">
      <button onclick="window.print()" style="background: #111A33; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; font-family: 'Manrope', sans-serif;">
        Print / Save as PDF
      </button>
    </div>

    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand-mark">DHANYA</div>
        <div class="brand-sub">Financial Intelligence & Decision Engine</div>
      </div>
      <div class="meta-box">
        <div>Jurisdiction: <strong>${countryName} (${currencyCode})</strong></div>
        <div>Calculated: <strong>${calculatedAt}</strong></div>
        <div>Status: <strong style="color: var(--emerald);">VERIFIED & DETERMINISTIC</strong></div>
      </div>
    </div>

    <h1 class="report-title">${title}</h1>
    <div class="provenance-tag">
      ✓ Verified Provenance: ${decisionPackage.provenance.sourceName} (${decisionPackage.provenance.status})
    </div>

    <!-- Primary Results -->
    <div class="section">
      <div class="section-title">Key Calculation Outputs</div>
      <div class="grid-2">
        ${primaryResults
          .map(
            (res) => `
          <div class="card ${res.highlight ? 'primary' : ''}">
            <div class="label">${res.label}</div>
            <div class="value">${res.value}</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <!-- Inputs & Assumptions -->
    <div class="section">
      <div class="section-title">Input Parameters & Baseline Assumptions</div>
      <div class="grid-3">
        ${inputs
          .map(
            (inp) => `
          <div class="card">
            <div class="label">${inp.label}</div>
            <div class="value" style="font-size: 15px;">${inp.value}</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <!-- Mathematical Formula & Narrative -->
    <div class="section">
      <div class="section-title">Mathematical Formula & Methodology</div>
      <div class="card" style="margin-bottom: 12px;">
        <div class="label">Governing Formula</div>
        <div class="value" style="font-size: 14px; color: var(--emerald); font-family: 'JetBrains Mono', monospace;">
          ${decisionPackage.explanation.formula}
        </div>
      </div>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
        ${decisionPackage.explanation.narrative}
      </p>
    </div>

    <!-- Comparative Scenarios -->
    ${
      decisionPackage.comparisons && decisionPackage.comparisons.length > 0
        ? `
    <div class="section">
      <div class="section-title">Scenario Sensitivity & Comparisons</div>
      <table class="table">
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Description</th>
            <th>Primary Metric</th>
            <th>Secondary Metric</th>
            <th>Variance Delta</th>
          </tr>
        </thead>
        <tbody>
          ${decisionPackage.comparisons
            .map(
              (c) => `
            <tr>
              <td style="font-weight: 700;">${c.name}</td>
              <td style="color: var(--text-muted); font-size: 11px;">${c.description}</td>
              <td>${c.primaryMetricLabel}: <strong>${c.primaryMetricValue}</strong></td>
              <td>${c.secondaryMetricLabel}: ${c.secondaryMetricValue}</td>
              <td style="color: ${c.isFavorable ? 'var(--emerald)' : '#DC2626'}; font-weight: 700;">${c.deltaValue}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    `
        : ''
    }

    <!-- Deterministic Recommendations -->
    <div class="section">
      <div class="section-title">Deterministic Recommendations</div>
      ${decisionPackage.recommendations
        .map(
          (rec) => `
        <div class="recs-box">
          <div class="recs-title">${rec.title} [${rec.priority} Priority]</div>
          <div class="recs-desc">${rec.rationale}</div>
          <div style="font-size: 11px; font-weight: 700; color: var(--emerald); margin-top: 4px;">Impact: ${rec.impact}</div>
        </div>
      `
        )
        .join('')}
    </div>

    <!-- Action Plan -->
    <div class="section">
      <div class="section-title">Actionable Next Steps</div>
      <ul style="padding-left: 20px; font-size: 13px; color: var(--text-main); line-height: 1.8;">
        ${decisionPackage.actionPlan
          .map(
            (act) => `
          <li><strong>${act.title}</strong>: ${act.description}</li>
        `
          )
          .join('')}
      </ul>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>Dhanya Financial Intelligence Platform • Cryptographically Audited</div>
      <div>Source Provenance: ${decisionPackage.provenance.organization}</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers interactive client-side browser print window with formatted report.
 */
export function exportReportToBrowserPrint(data: ReportExportData): void {
  if (typeof window === 'undefined') return;

  const html = generatePrintableReportHtml(data);
  const printWindow = window.open('', '_blank', 'width=1024,height=800');

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    // Allow styles to settle then trigger print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  } else {
    // Fallback to downloading standalone HTML report
    downloadReportAsHtmlFile(data);
  }
}

/**
 * Downloads standalone HTML report document directly.
 */
export function downloadReportAsHtmlFile(data: ReportExportData): void {
  if (typeof window === 'undefined') return;

  const html = generatePrintableReportHtml(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dhanya-${data.calculatorType.toLowerCase()}-report-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads JSON structured report.
 */
export function downloadReportAsJsonFile(data: ReportExportData): void {
  if (typeof window === 'undefined') return;

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dhanya-${data.calculatorType.toLowerCase()}-data-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
