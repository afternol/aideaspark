import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Packer,
  ShadingType,
  TableLayoutType,
} from "docx";

interface PlanContent {
  executiveSummary?: string;
  leanCanvas?: Record<string, string>;
  marketAnalysis?: { overview?: string; tam?: string; sam?: string; som?: string; trends?: string };
  competitorAnalysis?: { overview?: string; competitors?: { name: string; strength: string; weakness: string }[]; positioning?: string };
  businessModel?: { revenueModel?: string; pricing?: string; unitEconomics?: string };
  roadmap?: { phase: string; goals: string; actions: string; kpi: string }[];
  risks?: { risk: string; impact: string; mitigation: string }[];
  factCheckNotes?: string[];
}

const PRIMARY = "059669";
const GRAY = "6B7280";
const LIGHT_BG = "F9FAFB";
const BORDER = "E5E7EB";
const FONT = "Yu Gothic";

function thinBorder() {
  const b = { style: BorderStyle.SINGLE, size: 1, color: BORDER };
  return { top: b, bottom: b, left: b, right: b };
}

function noBorder() {
  const n = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: n, bottom: n, left: n, right: n };
}

function heading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 120 },
    children: [
      new TextRun({ text: "■ ", color: PRIMARY, size: 24, bold: true, font: FONT }),
      new TextRun({ text, color: "1F2937", size: 24, bold: true, font: FONT }),
    ],
  });
}

function subheading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    children: [
      new TextRun({ text, color: PRIMARY, size: 20, bold: true, font: FONT }),
    ],
  });
}

function bodyText(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 100 },
    indent: { left: 200 },
    children: [new TextRun({ text, size: 20, font: FONT, color: "374151" })],
  });
}

function spacer(size = 80): Paragraph {
  return new Paragraph({ spacing: { after: size }, children: [] });
}

export async function exportPlanDocx(serviceName: string, content: PlanContent, isCustom: boolean) {
  const c = content;
  const children: (Paragraph | Table)[] = [];

  // ===== Header =====
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: "ビジネスプラン",
          size: 16, bold: true, color: "FFFFFF", font: FONT,
          shading: { type: ShadingType.CLEAR, fill: PRIMARY, color: PRIMARY },
        }),
        ...(isCustom ? [new TextRun({ text: "  カスタマイズ版", size: 16, color: GRAY, font: FONT })] : []),
      ],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: serviceName, size: 36, bold: true, color: "111827", font: FONT })],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY } },
      children: [],
    }),
  );

  // ===== Executive Summary =====
  if (c.executiveSummary) {
    children.push(heading("エグゼクティブサマリー"));
    children.push(bodyText(c.executiveSummary));
  }

  // ===== Lean Canvas =====
  if (c.leanCanvas) {
    const lc = c.leanCanvas;
    const entries = [
      ["課題", lc.problem], ["解決策", lc.solution], ["独自の価値提案", lc.uniqueValue],
      ["顧客セグメント", lc.customerSegments], ["チャネル", lc.channels], ["収益の流れ", lc.revenueStreams],
      ["コスト構造", lc.costStructure], ["主要指標", lc.keyMetrics], ["圧倒的優位性", lc.unfairAdvantage],
    ].filter(([, v]) => v) as [string, string][];

    children.push(heading("リーンキャンバス"));

    const rows: TableRow[] = [];
    for (let i = 0; i < entries.length; i += 3) {
      const cells: TableCell[] = [];
      for (let j = 0; j < 3; j++) {
        const e = entries[i + j];
        cells.push(
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            borders: thinBorder(),
            shading: { type: ShadingType.CLEAR, fill: LIGHT_BG, color: LIGHT_BG },
            children: e
              ? [
                  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: e[0], size: 18, bold: true, color: PRIMARY, font: FONT })] }),
                  new Paragraph({ children: [new TextRun({ text: e[1], size: 18, font: FONT, color: "374151" })] }),
                ]
              : [new Paragraph({ children: [] })],
          }),
        );
      }
      rows.push(new TableRow({ children: cells }));
    }
    children.push(new Table({ layout: TableLayoutType.FIXED, width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
    children.push(spacer());
  }

  // ===== Market Analysis =====
  if (c.marketAnalysis) {
    const ma = c.marketAnalysis;
    children.push(heading("市場分析"));
    if (ma.overview) children.push(bodyText(ma.overview));

    const tamSamSom = [["TAM", ma.tam], ["SAM", ma.sam], ["SOM", ma.som]].filter(([, v]) => v) as [string, string][];
    if (tamSamSom.length) {
      children.push(
        new Table({
          layout: TableLayoutType.FIXED,
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: tamSamSom.map(
                ([label, val]) =>
                  new TableCell({
                    width: { size: Math.floor(100 / tamSamSom.length), type: WidthType.PERCENTAGE },
                    borders: thinBorder(),
                    shading: { type: ShadingType.CLEAR, fill: LIGHT_BG, color: LIGHT_BG },
                    children: [
                      new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: label, size: 18, bold: true, color: PRIMARY, font: FONT })] }),
                      new Paragraph({ children: [new TextRun({ text: val, size: 18, font: FONT, color: "374151" })] }),
                    ],
                  }),
              ),
            }),
          ],
        }),
      );
      children.push(spacer());
    }
    if (ma.trends) { children.push(subheading("トレンド")); children.push(bodyText(ma.trends)); }
  }

  // ===== Competitor Analysis =====
  if (c.competitorAnalysis) {
    const ca = c.competitorAnalysis;
    children.push(heading("競合分析"));
    if (ca.overview) children.push(bodyText(ca.overview));

    if (ca.competitors?.length) {
      const headerRow = new TableRow({
        children: ["競合", "強み", "弱み"].map(
          (label) =>
            new TableCell({
              borders: thinBorder(),
              shading: { type: ShadingType.CLEAR, fill: LIGHT_BG, color: LIGHT_BG },
              children: [new Paragraph({ children: [new TextRun({ text: label, size: 18, bold: true, font: FONT, color: "374151" })] })],
            }),
        ),
      });
      const dataRows = ca.competitors.map(
        (comp) =>
          new TableRow({
            children: [comp.name, comp.strength, comp.weakness].map(
              (text, idx) =>
                new TableCell({
                  borders: thinBorder(),
                  children: [new Paragraph({ children: [new TextRun({ text, size: 18, font: FONT, color: "374151", bold: idx === 0 })] })],
                }),
            ),
          }),
      );
      children.push(
        new Table({
          layout: TableLayoutType.FIXED,
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...dataRows],
        }),
      );
      children.push(spacer());
    }
    if (ca.positioning) { children.push(subheading("ポジショニング")); children.push(bodyText(ca.positioning)); }
  }

  // ===== Business Model =====
  if (c.businessModel) {
    const bm = c.businessModel;
    children.push(heading("ビジネスモデル"));
    if (bm.revenueModel) { children.push(subheading("収益モデル")); children.push(bodyText(bm.revenueModel)); }
    if (bm.pricing) { children.push(subheading("価格設定")); children.push(bodyText(bm.pricing)); }
    if (bm.unitEconomics) { children.push(subheading("ユニットエコノミクス")); children.push(bodyText(bm.unitEconomics)); }
  }

  // ===== Roadmap =====
  if (c.roadmap?.length) {
    children.push(heading("実行ロードマップ"));
    for (const phase of c.roadmap) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          shading: { type: ShadingType.CLEAR, fill: "F3F4F6", color: "F3F4F6" },
          children: [new TextRun({ text: phase.phase, size: 18, bold: true, font: FONT, color: "374151" })],
        }),
      );
      for (const [label, val] of [["目標", phase.goals], ["アクション", phase.actions], ["KPI", phase.kpi]]) {
        children.push(
          new Paragraph({
            spacing: { after: 30 },
            indent: { left: 200 },
            children: [
              new TextRun({ text: `${label}: `, size: 18, bold: true, color: PRIMARY, font: FONT }),
              new TextRun({ text: val, size: 18, font: FONT, color: "374151" }),
            ],
          }),
        );
      }
    }
    children.push(spacer());
  }

  // ===== Risks =====
  if (c.risks?.length) {
    children.push(heading("リスクと対策"));
    for (const r of c.risks) {
      const ic = r.impact === "高" ? "DC2626" : r.impact === "中" ? "CA8A04" : "2563EB";
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 30 },
          children: [
            new TextRun({ text: r.risk, size: 18, bold: true, font: FONT, color: "374151" }),
            new TextRun({ text: `  [影響度: ${r.impact}]`, size: 16, color: ic, font: FONT }),
          ],
        }),
      );
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: 200 },
          children: [new TextRun({ text: `対策: ${r.mitigation}`, size: 18, color: GRAY, font: FONT })],
        }),
      );
    }
  }

  // ===== Fact Check =====
  if (c.factCheckNotes?.length) {
    children.push(heading("ファクトチェック注記"));
    for (const note of c.factCheckNotes) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: `⚠ ${note}`, size: 16, color: "9CA3AF", font: FONT })],
        }),
      );
    }
  }

  // ===== Footer =====
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER } },
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: `Generated by AideaSpark — ${new Date().toLocaleDateString("ja-JP")}`,
          size: 16, color: "9CA3AF", font: FONT,
        }),
      ],
    }),
  );

  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children }],
  });

  const blob = await Packer.toBlob(doc);
  const { saveAs } = await import("file-saver");
  saveAs(blob, `${serviceName}-ビジネスプラン.docx`);
}
