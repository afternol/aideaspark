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

const PRIMARY = "#059669";
const GRAY = "#6b7280";

function h2(text: string): string {
  return `<div style="margin:20px 0 10px 0;display:flex;align-items:center;gap:8px;">
    <div style="width:4px;height:22px;border-radius:2px;background:${PRIMARY};"></div>
    <span style="font-size:16px;font-weight:700;color:#1f2937;">${text}</span>
  </div>`;
}

function h3(text: string): string {
  return `<div style="font-size:13px;font-weight:700;color:${PRIMARY};margin:10px 0 4px 0;">${text}</div>`;
}

function p(text: string): string {
  return `<div style="font-size:13px;line-height:1.7;color:#374151;margin-bottom:8px;">${text}</div>`;
}

function card(label: string, value: string): string {
  return `<td style="vertical-align:top;padding:4px;">
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px;background:#f9fafb;">
      <div style="font-size:11px;font-weight:700;color:${PRIMARY};margin-bottom:4px;">${label}</div>
      <div style="font-size:12px;line-height:1.6;color:#374151;">${value}</div>
    </div>
  </td>`;
}

function buildPlanHTML(serviceName: string, c: PlanContent, isCustom: boolean): string {
  let body = "";

  // Header
  body += `<div style="border-bottom:3px solid ${PRIMARY};padding-bottom:16px;margin-bottom:24px;">
    <table><tr>
      <td><div style="background:${PRIMARY};color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:4px;display:inline-block;">ビジネスプラン</div></td>
      ${isCustom ? `<td style="padding-left:8px;"><span style="font-size:10px;color:${GRAY};background:#f3f4f6;padding:2px 8px;border-radius:4px;">カスタマイズ版</span></td>` : ""}
    </tr></table>
    <h1 style="font-size:24px;font-weight:800;color:#111827;margin:8px 0 0 0;">${serviceName}</h1>
  </div>`;

  // Executive Summary
  if (c.executiveSummary) {
    body += h2("エグゼクティブサマリー");
    body += p(c.executiveSummary);
  }

  // Lean Canvas
  if (c.leanCanvas) {
    const lc = c.leanCanvas;
    const entries = [
      ["課題", lc.problem], ["解決策", lc.solution], ["独自の価値提案", lc.uniqueValue],
      ["顧客セグメント", lc.customerSegments], ["チャネル", lc.channels], ["収益の流れ", lc.revenueStreams],
      ["コスト構造", lc.costStructure], ["主要指標", lc.keyMetrics], ["圧倒的優位性", lc.unfairAdvantage],
    ].filter(([, v]) => v) as [string, string][];

    body += h2("リーンキャンバス");
    body += `<table style="width:100%;border-collapse:collapse;">`;
    for (let i = 0; i < entries.length; i += 3) {
      body += `<tr>`;
      for (let j = 0; j < 3; j++) {
        if (entries[i + j]) body += card(entries[i + j][0], entries[i + j][1]);
        else body += `<td></td>`;
      }
      body += `</tr>`;
    }
    body += `</table>`;
  }

  // Market Analysis
  if (c.marketAnalysis) {
    const ma = c.marketAnalysis;
    body += h2("市場分析");
    if (ma.overview) body += p(ma.overview);
    const tamSamSom = [["TAM", ma.tam], ["SAM", ma.sam], ["SOM", ma.som]].filter(([, v]) => v) as [string, string][];
    if (tamSamSom.length) {
      body += `<table style="width:100%;border-collapse:collapse;"><tr>`;
      for (const [label, val] of tamSamSom) body += card(label, val);
      body += `</tr></table>`;
    }
    if (ma.trends) { body += h3("トレンド"); body += p(ma.trends); }
  }

  // Competitor Analysis
  if (c.competitorAnalysis) {
    const ca = c.competitorAnalysis;
    body += h2("競合分析");
    if (ca.overview) body += p(ca.overview);
    if (ca.competitors?.length) {
      body += `<table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="background:#f3f4f6;">
          <th style="padding:6px 10px;text-align:left;border-bottom:1px solid #e5e7eb;font-weight:700;">競合</th>
          <th style="padding:6px 10px;text-align:left;border-bottom:1px solid #e5e7eb;font-weight:700;">強み</th>
          <th style="padding:6px 10px;text-align:left;border-bottom:1px solid #e5e7eb;font-weight:700;">弱み</th>
        </tr>`;
      for (const comp of ca.competitors) {
        body += `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:600;">${comp.name}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${comp.strength}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${comp.weakness}</td>
        </tr>`;
      }
      body += `</table>`;
    }
    if (ca.positioning) { body += h3("ポジショニング"); body += p(ca.positioning); }
  }

  // Business Model
  if (c.businessModel) {
    const bm = c.businessModel;
    body += h2("ビジネスモデル");
    if (bm.revenueModel) { body += h3("収益モデル"); body += p(bm.revenueModel); }
    if (bm.pricing) { body += h3("価格設定"); body += p(bm.pricing); }
    if (bm.unitEconomics) { body += h3("ユニットエコノミクス"); body += p(bm.unitEconomics); }
  }

  // Roadmap
  if (c.roadmap?.length) {
    body += h2("実行ロードマップ");
    for (const phase of c.roadmap) {
      body += `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;margin-bottom:8px;">
        <div style="display:inline-block;background:#f3f4f6;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:700;color:#374151;margin-bottom:6px;">${phase.phase}</div>
        <div style="font-size:12px;line-height:1.7;color:#374151;">
          <div><span style="font-weight:700;color:${PRIMARY};">目標:</span> ${phase.goals}</div>
          <div><span style="font-weight:700;color:${PRIMARY};">アクション:</span> ${phase.actions}</div>
          <div><span style="font-weight:700;color:${PRIMARY};">KPI:</span> ${phase.kpi}</div>
        </div>
      </div>`;
    }
  }

  // Risks
  if (c.risks?.length) {
    body += h2("リスクと対策");
    for (const r of c.risks) {
      const ic = r.impact === "高" ? "#dc2626" : r.impact === "中" ? "#ca8a04" : "#2563eb";
      body += `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;margin-bottom:8px;font-size:12px;">
        <span style="font-weight:700;">${r.risk}</span>
        <span style="margin-left:8px;padding:1px 8px;border:1px solid ${ic};border-radius:4px;font-size:10px;color:${ic};">影響度: ${r.impact}</span>
        <div style="margin-top:4px;color:${GRAY};">対策: ${r.mitigation}</div>
      </div>`;
    }
  }

  // Fact check notes
  if (c.factCheckNotes?.length) {
    body += h2("ファクトチェック注記");
    for (const note of c.factCheckNotes) {
      body += `<div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">⚠ ${note}</div>`;
    }
  }

  // Footer
  body += `<div style="margin-top:32px;padding-top:12px;border-top:1px solid #e5e7eb;text-align:right;">
    <span style="font-size:10px;color:#9ca3af;">Generated by BizIdea — ${new Date().toLocaleDateString("ja-JP")}</span>
  </div>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:"Hiragino Kaku Gothic ProN","Hiragino Sans","Meiryo","Yu Gothic",sans-serif; background:#fff; color:#1f2937; padding:40px; width:800px; }
  table { border-collapse:collapse; }
</style>
</head><body>${body}</body></html>`;
}

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
      if (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240) nonWhite++;
    }
    if (nonWhite < best.score) { best.score = nonWhite; best.row = row; }
    if (nonWhite === 0) break;
  }
  return best.row;
}

export async function exportPlanPDF(serviceName: string, content: PlanContent, isCustom: boolean) {
  const html2canvasModule = await import("html2canvas");
  const html2canvas = html2canvasModule.default ?? html2canvasModule;
  const jspdfModule = await import("jspdf");
  const jsPDF = jspdfModule.jsPDF ?? jspdfModule.default;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;height:600px;border:none;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument!;
    iframeDoc.open();
    iframeDoc.write(buildPlanHTML(serviceName, content, isCustom));
    iframeDoc.close();

    await new Promise<void>((resolve) => { iframe.onload = () => resolve(); setTimeout(resolve, 500); });

    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false, width: 800, windowWidth: 800,
    });

    const pxPerMm = canvas.width / 210;
    const pageHeightPx = Math.floor(297 * pxPerMm);
    const marginPx = Math.floor(8 * pxPerMm);
    const searchRange = Math.floor(40 * pxPerMm);

    const pdf = new jsPDF("p", "mm", "a4");
    let sliceStart = 0;
    let pageIndex = 0;

    while (sliceStart < canvas.height) {
      if (pageIndex > 0) pdf.addPage();
      const usableHeight = pageIndex === 0 ? pageHeightPx : pageHeightPx - marginPx;
      let sliceEnd: number;
      if (sliceStart + usableHeight >= canvas.height) {
        sliceEnd = canvas.height;
      } else {
        sliceEnd = findBreakRow(canvas, sliceStart + usableHeight, searchRange);
      }
      const sliceH = sliceEnd - sliceStart;
      if (sliceH <= 0) break;

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceH;
      const sliceCtx = sliceCanvas.getContext("2d")!;
      sliceCtx.fillStyle = "#ffffff";
      sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceH);
      sliceCtx.drawImage(canvas, 0, sliceStart, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      const yOffset = pageIndex === 0 ? 0 : marginPx / pxPerMm;
      pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, yOffset, 210, sliceH / pxPerMm);

      sliceStart = sliceEnd;
      pageIndex++;
    }

    pdf.save(`${serviceName}-ビジネスプラン.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}
