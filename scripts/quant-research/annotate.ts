/**
 * Renders an annotated copy of a chart screenshot — horizontal lines for
 * entry / stop loss / take profit / supports / resistances, with price labels.
 * Uses Playwright to draw onto an HTML canvas overlay, then screenshots.
 *
 * Requires `chartCalibration` from the chart-analysis result so prices map
 * to y-percent inside the chart's plot area (not the whole image).
 */
import { chromium, type Browser } from "playwright";
import path from "path";
import fs from "fs/promises";

export type Anchor = { price: number; yPercent: number };

export type Calibration = {
  scale: "linear" | "log";
  anchors: Anchor[];
  plotArea?: { topYPercent: number; bottomYPercent: number };
};

export type AnnotationLine = {
  price: number;
  label: string;
  color: string;
  dashed?: boolean;
};

export type AnnotateInput = {
  chartImagePath: string;     // absolute path to raw screenshot
  outPath: string;            // absolute path for annotated output
  calibration: Calibration;
  lines: AnnotationLine[];
};

const COLORS = {
  entry: "#3b82f6",
  stopLoss: "#ef4444",
  takeProfit: "#22c55e",
  support: "#10b981",
  resistance: "#f59e0b",
  trend: "#a78bfa",
};

export function colorFor(type: string): string {
  switch (type) {
    case "entry": return COLORS.entry;
    case "stopLoss": return COLORS.stopLoss;
    case "takeProfit": return COLORS.takeProfit;
    case "support": return COLORS.support;
    case "resistance": return COLORS.resistance;
    default: return COLORS.trend;
  }
}

function buildHtml(b64: string, w: number, h: number, payload: string): string {
  // Self-contained renderer. Image at native size, canvas overlay on top.
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:#0a0a0a;}
  .wrap{position:relative;width:${w}px;height:${h}px;}
  .wrap img{display:block;width:${w}px;height:${h}px;}
  .wrap canvas{position:absolute;inset:0;width:${w}px;height:${h}px;}
</style></head><body>
<div class="wrap" id="wrap">
  <img id="chart" src="data:image/png;base64,${b64}"/>
  <canvas id="overlay" width="${w}" height="${h}"></canvas>
</div>
<script>
const PAYLOAD = ${payload};
const W = ${w}, H = ${h};

// Linear interpolation between calibration anchors. anchors are sorted by
// price ascending; yPercent grows downward (0=top, 100=bottom).
function priceToYPx(price, cal) {
  const a = [...cal.anchors].sort((x,y)=>x.price-y.price);
  if (a.length === 0) return H/2;
  const useLog = cal.scale === "log";
  const t = useLog ? Math.log(price) : price;
  const tA = a.map(p => useLog ? Math.log(p.price) : p.price);
  // Find bracket
  let lo = 0, hi = a.length - 1;
  for (let i=0;i<a.length-1;i++) { if (tA[i] <= t && t <= tA[i+1]) { lo=i; hi=i+1; break; } }
  if (t < tA[0]) { lo=0; hi=Math.min(1, a.length-1); }
  if (t > tA[a.length-1]) { lo=Math.max(0,a.length-2); hi=a.length-1; }
  const span = tA[hi] - tA[lo] || 1;
  const frac = (t - tA[lo]) / span;
  const yPctRaw = a[lo].yPercent + frac * (a[hi].yPercent - a[lo].yPercent);
  // Clamp inside plot area if provided
  let yPct = yPctRaw;
  if (cal.plotArea) {
    yPct = Math.max(cal.plotArea.topYPercent, Math.min(cal.plotArea.bottomYPercent, yPct));
  }
  return Math.round((yPct / 100) * H);
}

const ctx = document.getElementById('overlay').getContext('2d');
ctx.font = "600 14px -apple-system, system-ui, sans-serif";
ctx.textBaseline = "middle";
const lines = PAYLOAD.lines;
for (const ln of lines) {
  const y = priceToYPx(ln.price, PAYLOAD.calibration);
  ctx.save();
  ctx.strokeStyle = ln.color;
  ctx.fillStyle = ln.color;
  ctx.lineWidth = 2;
  if (ln.dashed) ctx.setLineDash([8, 6]);
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(W, y);
  ctx.stroke();
  ctx.setLineDash([]);
  // Pill label on the right
  const label = ln.label + " " + ln.price.toLocaleString(undefined, {maximumFractionDigits: 6});
  const padX = 10, padY = 4;
  const textW = ctx.measureText(label).width;
  const boxW = textW + padX * 2;
  const boxH = 22;
  const boxX = W - boxW - 8;
  const boxY = Math.max(2, Math.min(H - boxH - 2, y - boxH / 2));
  ctx.globalAlpha = 1;
  ctx.fillStyle = ln.color;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.fillStyle = "#0b0b0b";
  ctx.fillText(label, boxX + padX, boxY + boxH/2 + 1);
  ctx.restore();
}
window.__READY = true;
</script>
</body></html>`;
}

export async function annotateChart(input: AnnotateInput): Promise<string> {
  const buf = await fs.readFile(input.chartImagePath);
  const b64 = buf.toString("base64");

  // Read native dimensions of the raw chart so the overlay matches 1:1
  const dims = await readPngSize(buf);
  const payload = JSON.stringify({ calibration: input.calibration, lines: input.lines });
  const html = buildHtml(b64, dims.w, dims.h, payload);

  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({
      viewport: { width: dims.w, height: dims.h },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.waitForFunction("window.__READY === true", { timeout: 15_000 });
    await fs.mkdir(path.dirname(input.outPath), { recursive: true });
    await page.locator(".wrap").screenshot({ path: input.outPath, type: "png" });
    await ctx.close();
    return input.outPath;
  } finally {
    await browser.close();
  }
}

// PNG header parser — reads native dimensions from the IHDR chunk.
async function readPngSize(buf: Buffer): Promise<{ w: number; h: number }> {
  // PNG signature is 8 bytes, then IHDR length(4) + type(4) + width(4) + height(4)
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  return { w, h };
}
