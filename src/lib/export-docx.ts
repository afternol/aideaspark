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
  HeadingLevel,
  Packer,
  ShadingType,
  TableLayoutType,
} from "docx";
import type { IdeaScore } from "@/lib/types";
import { SCORE_LABELS } from "@/lib/types";

interface CustomIdeaForDocx {
  serviceName: string;
  oneLiner: string;
  concept: string;
  target: string;
  problem?: string;
  product?: string;
  revenueModel: string;
  competitors?: string;
  competitiveEdge: string;
  scores: IdeaScore;
  changes: string[];
}

const PRIMARY = "059669";
const GRAY = "6B7280";
const LIGHT_BG = "F9FAFB";
const GREEN_BG = "F0FDF4";
const BORDER = "E5E7EB";

const scoreColor = (n: number) =>
  n >= 4 ? "059669" : n >= 3 ? "CA8A04" : "DC2626";

const scoreBg = (n: number) =>
  n >= 4 ? "ECFDF5" : n >= 3 ? "FEFCE8" : "FEF2F2";

function noBorder() {
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: none, bottom: none, left: none, right: none };
}

function thinBorder() {
  const b = { style: BorderStyle.SINGLE, size: 1, color: BORDER };
  return { top: b, bottom: b, left: b, right: b };
}

function bulletLines(text: string): Paragraph[] {
  return text
    .replace(/\*\*/g, "")
    .split(/[\n/]/)
    .map((l) => l.replace(/^[・•\-*]\s*/, "").trim())
    .filter(Boolean)
    .map(
      (line) =>
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "▸ ", color: PRIMARY, size: 20, font: "Yu Gothic" }),
            new TextRun({ text: line, size: 20, font: "Yu Gothic", color: "374151" }),
          ],
        }),
    );
}

function sectionHeading(label: string, color: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({ text: "■ ", color, size: 22, bold: true, font: "Yu Gothic" }),
      new TextRun({ text: label, color: "1F2937", size: 22, bold: true, font: "Yu Gothic" }),
    ],
  });
}

function sectionBody(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    indent: { left: 200 },
    children: [
      new TextRun({ text, size: 20, font: "Yu Gothic", color: "374151" }),
    ],
  });
}

export async function exportCustomIdeaDocx(
  result: CustomIdeaForDocx,
  baseIdeaName?: string,
  conditions?: string,
) {
  const avg =
    Math.round(
      (Object.values(result.scores).reduce((a, b) => a + b, 0) / 6) * 10,
    ) / 10;

  const children: (Paragraph | Table)[] = [];

  // ===== Header =====
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: "AIカスタマイズ版",
          size: 16,
          bold: true,
          color: "FFFFFF",
          font: "Yu Gothic",
          shading: { type: ShadingType.CLEAR, fill: PRIMARY, color: PRIMARY },
        }),
        ...(baseIdeaName
          ? [new TextRun({ text: `   元: ${baseIdeaName}`, size: 18, color: GRAY, font: "Yu Gothic" })]
          : []),
      ],
    }),
  );

  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: result.serviceName, size: 36, bold: true, color: "111827", font: "Yu Gothic" }),
      ],
    }),
  );

  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: result.oneLiner, size: 20, color: GRAY, font: "Yu Gothic" }),
      ],
    }),
  );

  if (conditions) {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: `条件: ${conditions}`, size: 18, color: "9CA3AF", font: "Yu Gothic" }),
        ],
      }),
    );
  }

  // ===== Separator =====
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY } },
      children: [],
    }),
  );

  // ===== Changes =====
  if (result.changes?.length) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        shading: { type: ShadingType.CLEAR, fill: GREEN_BG, color: GREEN_BG },
        children: [
          new TextRun({ text: "主な変更点", size: 20, bold: true, color: PRIMARY, font: "Yu Gothic" }),
        ],
      }),
    );
    for (const change of result.changes) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          indent: { left: 200 },
          children: [
            new TextRun({ text: "→ ", color: PRIMARY, size: 18, font: "Yu Gothic" }),
            new TextRun({ text: change, size: 18, color: "374151", font: "Yu Gothic" }),
          ],
        }),
      );
    }
    children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  }

  // ===== Score table =====
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({ text: `総合スコア: `, size: 22, color: GRAY, font: "Yu Gothic" }),
        new TextRun({ text: `${avg}`, size: 32, bold: true, color: scoreColor(avg), font: "Yu Gothic" }),
        new TextRun({ text: ` / 5.0`, size: 20, color: "9CA3AF", font: "Yu Gothic" }),
      ],
    }),
  );

  const scoreKeys = Object.keys(SCORE_LABELS) as (keyof IdeaScore)[];
  const scoreTable = new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: thinBorder(),
            shading: { type: ShadingType.CLEAR, fill: LIGHT_BG, color: LIGHT_BG },
            children: [new Paragraph({ children: [new TextRun({ text: "評価軸", size: 18, bold: true, font: "Yu Gothic", color: "374151" })] })],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: thinBorder(),
            shading: { type: ShadingType.CLEAR, fill: LIGHT_BG, color: LIGHT_BG },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "スコア", size: 18, bold: true, font: "Yu Gothic", color: "374151" })] })],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: thinBorder(),
            shading: { type: ShadingType.CLEAR, fill: LIGHT_BG, color: LIGHT_BG },
            children: [new Paragraph({ children: [] })],
          }),
        ],
      }),
      ...scoreKeys.map(
        (key) =>
          new TableRow({
            children: [
              new TableCell({
                borders: thinBorder(),
                children: [new Paragraph({ children: [new TextRun({ text: SCORE_LABELS[key], size: 20, font: "Yu Gothic", color: "374151" })] })],
              }),
              new TableCell({
                borders: thinBorder(),
                shading: { type: ShadingType.CLEAR, fill: scoreBg(result.scores[key]), color: scoreBg(result.scores[key]) },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: `${result.scores[key]}`, size: 22, bold: true, color: scoreColor(result.scores[key]), font: "Yu Gothic" })],
                  }),
                ],
              }),
              new TableCell({
                borders: thinBorder(),
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "█".repeat(result.scores[key]) + "░".repeat(5 - result.scores[key]), size: 22, color: scoreColor(result.scores[key]), font: "Yu Gothic" })],
                  }),
                ],
              }),
            ],
          }),
      ),
    ],
  });
  children.push(scoreTable);
  children.push(new Paragraph({ spacing: { after: 160 }, children: [] }));

  // ===== Detail sections =====
  children.push(sectionHeading("コンセプト・提供価値", PRIMARY));
  children.push(sectionBody(result.concept));

  children.push(sectionHeading("ターゲット", "2563EB"));
  children.push(sectionBody(result.target));

  if (result.problem) {
    children.push(sectionHeading("解決する課題", "D97706"));
    children.push(sectionBody(result.problem));
  }

  if (result.product) {
    children.push(sectionHeading("プロダクト・サービス内容", "7C3AED"));
    children.push(...bulletLines(result.product));
  }

  children.push(sectionHeading("収益モデル", PRIMARY));
  children.push(...bulletLines(result.revenueModel));

  if (result.competitors) {
    children.push(sectionHeading("類似・競合サービス", GRAY));
    children.push(sectionBody(result.competitors));
  }

  if (result.competitiveEdge) {
    children.push(sectionHeading("競合優位性", "DC2626"));
    children.push(sectionBody(result.competitiveEdge));
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
          size: 16,
          color: "9CA3AF",
          font: "Yu Gothic",
        }),
      ],
    }),
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const { saveAs } = await import("file-saver");
  saveAs(blob, `${result.serviceName}-カスタマイズ版.docx`);
}
