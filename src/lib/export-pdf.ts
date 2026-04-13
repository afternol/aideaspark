import type { IdeaScore } from "@/lib/types";
import { SCORE_LABELS } from "@/lib/types";

interface CustomIdeaForPDF {
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

function buildFullHTML(result: CustomIdeaForPDF, baseIdeaName?: string, conditions?: string): string {
  const avg = Math.round(
    (Object.values(result.scores).reduce((a, b) => a + b, 0) / 6) * 10,
  ) / 10;

  const scoreColor = (n: number) =>
    n >= 4 ? "#059669" : n >= 3 ? "#ca8a04" : "#dc2626";

  const scoreBg = (n: number) =>
    n >= 4 ? "#ecfdf5" : n >= 3 ? "#fefce8" : "#fef2f2";

  const scoreRows = (Object.keys(SCORE_LABELS) as (keyof IdeaScore)[])
    .map(
      (key) =>
        `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${SCORE_LABELS[key]}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">
            <span style="display:inline-block;width:28px;height:28px;line-height:28px;border-radius:50%;background:${scoreBg(result.scores[key])};color:${scoreColor(result.scores[key])};font-weight:800;font-size:14px;text-align:center;">
              ${result.scores[key]}
            </span>
          </td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">
            <div style="background:#e5e7eb;border-radius:4px;height:8px;width:120px;">
              <div style="background:${scoreColor(result.scores[key])};border-radius:4px;height:8px;width:${result.scores[key] * 20}%;"></div>
            </div>
          </td>
        </tr>`,
    )
    .join("");

  const bulletList = (text: string) =>
    text
      .replace(/\*\*/g, "")
      .split(/[\n/]/)
      .map((l) => l.replace(/^[・•\-*]\s*/, "").trim())
      .filter(Boolean)
      .map((l) => `<li style="margin-bottom:4px;">${l}</li>`)
      .join("");

  const section = (label: string, color: string, content: string) =>
    `<div style="margin-bottom:16px;">
      <table><tr>
        <td style="vertical-align:top;padding-right:8px;"><div style="width:4px;height:20px;border-radius:2px;background:${color};"></div></td>
        <td><span style="font-size:14px;font-weight:700;color:#1f2937;">${label}</span></td>
      </tr></table>
      <div style="font-size:13px;line-height:1.7;color:#374151;padding-left:12px;margin-top:6px;">
        ${content}
      </div>
    </div>`;

  const changes = result.changes?.length
    ? `<div style="background:#f0fdf4;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
        <div style="font-size:12px;font-weight:700;color:#059669;margin-bottom:6px;">主な変更点</div>
        <ul style="margin:0;padding-left:16px;font-size:12px;line-height:1.6;color:#374151;">
          ${result.changes.map((c) => `<li>${c}</li>`).join("")}
        </ul>
      </div>`
    : "";

  // Self-contained HTML document — no external CSS, all hex colors
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Meiryo", "Yu Gothic", sans-serif;
    background: #ffffff;
    color: #1f2937;
    padding: 40px;
    width: 800px;
  }
  ul { padding-left: 18px; list-style: disc; }
  table { border-collapse: collapse; }
</style>
</head><body>
  <div style="border-bottom:3px solid #059669;padding-bottom:16px;margin-bottom:24px;">
    <table><tr>
      <td><div style="background:#059669;color:#ffffff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:4px;display:inline-block;">AIカスタマイズ版</div></td>
      ${baseIdeaName ? `<td style="padding-left:8px;"><span style="font-size:11px;color:#6b7280;">元: ${baseIdeaName}</span></td>` : ""}
    </tr></table>
    <h1 style="font-size:24px;font-weight:800;color:#111827;margin:8px 0 0 0;">${result.serviceName}</h1>
    <p style="font-size:14px;color:#6b7280;margin-top:4px;">${result.oneLiner}</p>
    ${conditions ? `<p style="font-size:11px;color:#9ca3af;margin-top:8px;">条件: ${conditions}</p>` : ""}
  </div>

  ${changes}

  <table style="margin-bottom:24px;">
    <tr>
      <td style="vertical-align:top;padding-right:20px;">
        <div style="text-align:center;padding:16px 24px;background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">
          <div style="font-size:11px;color:#6b7280;">総合スコア</div>
          <div style="font-size:36px;font-weight:900;color:${scoreColor(avg)};">${avg}</div>
          <div style="font-size:11px;color:#9ca3af;">/ 5.0</div>
        </div>
      </td>
      <td style="vertical-align:top;">
        <table>${scoreRows}</table>
      </td>
    </tr>
  </table>

  ${section("コンセプト・提供価値", "#059669", result.concept)}
  ${section("ターゲット", "#2563eb", result.target)}
  ${result.problem ? section("解決する課題", "#d97706", result.problem) : ""}
  ${result.product ? section("プロダクト・サービス内容", "#7c3aed", `<ul>${bulletList(result.product)}</ul>`) : ""}
  ${section("収益モデル", "#059669", `<ul>${bulletList(result.revenueModel)}</ul>`)}
  ${result.competitors ? section("類似・競合サービス", "#6b7280", result.competitors) : ""}
  ${result.competitiveEdge ? section("競合優位性", "#dc2626", result.competitiveEdge) : ""}

  <div style="margin-top:32px;padding-top:12px;border-top:1px solid #e5e7eb;text-align:right;">
    <span style="font-size:10px;color:#9ca3af;">Generated by BizIdea — ${new Date().toLocaleDateString("ja-JP")}</span>
  </div>
</body></html>`;
}

/**
 * Scan canvas pixel rows to find the nearest "white space" row
 * within a search range around the target break point.
 * Returns the best row (in canvas pixels) to slice at.
 */
function findBreakRow(canvas: HTMLCanvasElement, targetRow: number, searchRange: number): number {
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const best = { row: targetRow, score: Infinity };

  const lo = Math.max(0, targetRow - searchRange);
  const hi = Math.min(canvas.height - 1, targetRow + Math.round(searchRange * 0.3));

  for (let row = lo; row <= hi; row++) {
    const data = ctx.getImageData(0, row, w, 1).data;
    let nonWhite = 0;
    for (let i = 0; i < data.length; i += 4) {
      // Count pixels that are not near-white
      if (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240) {
        nonWhite++;
      }
    }
    if (nonWhite < best.score) {
      best.score = nonWhite;
      best.row = row;
    }
    // Perfect blank row found
    if (nonWhite === 0) break;
  }

  return best.row;
}

export async function exportCustomIdeaPDF(
  result: CustomIdeaForPDF,
  baseIdeaName?: string,
  conditions?: string,
) {
  const html2canvasModule = await import("html2canvas");
  const html2canvas = html2canvasModule.default ?? html2canvasModule;
  const jspdfModule = await import("jspdf");
  const jsPDF = jspdfModule.jsPDF ?? jspdfModule.default;

  // Use an iframe to fully isolate from Tailwind's oklch/lab colors
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;height:600px;border:none;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument!;
    const html = buildFullHTML(result, baseIdeaName, conditions);
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for render
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      setTimeout(resolve, 500);
    });

    const body = iframeDoc.body;
    const canvas = await html2canvas(body, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: 800,
      windowWidth: 800,
    });

    const pxPerMm = canvas.width / 210; // canvas pixels per mm
    const pageHeightPx = Math.floor(297 * pxPerMm);
    const marginPx = Math.floor(8 * pxPerMm); // 8mm margin at page top/bottom
    const searchRange = Math.floor(40 * pxPerMm); // search ±40mm for a blank row

    const pdf = new jsPDF("p", "mm", "a4");
    let sliceStart = 0;
    let pageIndex = 0;

    while (sliceStart < canvas.height) {
      if (pageIndex > 0) pdf.addPage();

      let sliceEnd: number;
      const usableHeight = pageIndex === 0 ? pageHeightPx : pageHeightPx - marginPx;

      if (sliceStart + usableHeight >= canvas.height) {
        // Last page — take everything remaining
        sliceEnd = canvas.height;
      } else {
        // Find best break point near the target
        sliceEnd = findBreakRow(canvas, sliceStart + usableHeight, searchRange);
      }

      const sliceH = sliceEnd - sliceStart;
      if (sliceH <= 0) break;

      // Extract slice into a temporary canvas
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceH;
      const sliceCtx = sliceCanvas.getContext("2d")!;
      sliceCtx.fillStyle = "#ffffff";
      sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceH);
      sliceCtx.drawImage(canvas, 0, sliceStart, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      const sliceImg = sliceCanvas.toDataURL("image/png");
      const sliceWidthMm = 210;
      const sliceHeightMm = sliceH / pxPerMm;

      // Add top margin on pages after the first
      const yOffset = pageIndex === 0 ? 0 : marginPx / pxPerMm;
      pdf.addImage(sliceImg, "PNG", 0, yOffset, sliceWidthMm, sliceHeightMm);

      sliceStart = sliceEnd;
      pageIndex++;
    }

    pdf.save(`${result.serviceName}-カスタマイズ版.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}
