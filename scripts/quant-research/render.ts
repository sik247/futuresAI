/**
 * Server-side chart renderer using TradingView's lightweight-charts library.
 * We load the lib via CDN inside a Playwright page, inject data through
 * window globals, and screenshot the rendered chart.
 *
 * Each function returns a path to the rendered PNG.
 */
import { chromium, type Browser, type Page } from "playwright";
import path from "path";
import fs from "fs/promises";
import { rsi as calcRsi, macd as calcMacd, type Candle, type FundingPoint, type OiPoint, type LsPoint } from "./data";

// Pinned to a stable major version. Loaded via CDN in the rendered HTML page.
const LWC_CDN = "https://unpkg.com/lightweight-charts@4.2.2/dist/lightweight-charts.standalone.production.js";

const W = 1280;
const H = 540;

const COMMON_OPTIONS = `{
  layout: { background: { color: '#0a0a0a' }, textColor: '#d4d4d8', fontSize: 12 },
  grid: { vertLines: { color: '#1f1f23' }, horzLines: { color: '#1f1f23' } },
  rightPriceScale: { borderColor: '#27272a' },
  timeScale: { borderColor: '#27272a', timeVisible: true, secondsVisible: false },
  crosshair: { mode: 0 },
}`;

function buildHtml(scriptBody: string, w = W, h = H): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:#0a0a0a;color:#d4d4d8;font-family:-apple-system,system-ui,sans-serif;}
  #wrap{position:relative;width:${w}px;height:${h}px;}
  #title{position:absolute;top:10px;left:14px;font-size:13px;font-weight:600;letter-spacing:.02em;color:#fafafa;z-index:2;pointer-events:none;}
  #subtitle{position:absolute;top:30px;left:14px;font-size:11px;color:#71717a;z-index:2;pointer-events:none;}
  #brand{position:absolute;bottom:10px;right:14px;font-size:10px;color:#52525b;z-index:2;pointer-events:none;letter-spacing:.05em;}
  #chart{width:${w}px;height:${h}px;}
</style></head><body>
<div id="wrap">
  <div id="title"></div>
  <div id="subtitle"></div>
  <div id="brand">FuturesAI · Binance</div>
  <div id="chart"></div>
</div>
<script src="${LWC_CDN}"></script>
<script>
  window.__READY = false;
  function go() {
    if (typeof LightweightCharts === 'undefined') return setTimeout(go, 50);
    try {
      ${scriptBody}
      requestAnimationFrame(() => { requestAnimationFrame(() => { window.__READY = true; }); });
    } catch (e) {
      window.__ERR = String(e && e.stack || e);
      window.__READY = true;
    }
  }
  go();
</script>
</body></html>`;
}

async function renderHtml(html: string, outPath: string, w = W, h = H): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: "dark" });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.waitForFunction("window.__READY === true", { timeout: 20_000 });
    const err = await page.evaluate(() => (window as any).__ERR);
    if (err) throw new Error("renderer failed: " + err);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await page.locator("#wrap").screenshot({ path: outPath, type: "png" });
    await ctx.close();
    return outPath;
  } finally {
    await browser.close();
  }
}

// ---- Price chart (candlesticks + volume pane) ----

export async function renderPriceChart(
  candles: Candle[],
  outPath: string,
  opts: { title: string; subtitle?: string },
): Promise<string> {
  const upColor = "#22c55e", downColor = "#ef4444";
  const candleData = candles.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }));
  const volumeData = candles.map((c) => ({
    time: c.time,
    value: c.volume,
    color: c.close >= c.open ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)",
  }));

  const script = `
    document.getElementById('title').textContent = ${JSON.stringify(opts.title)};
    document.getElementById('subtitle').textContent = ${JSON.stringify(opts.subtitle ?? "")};
    const chart = LightweightCharts.createChart(document.getElementById('chart'), { width: ${W}, height: ${H}, ...${COMMON_OPTIONS} });
    const cs = chart.addCandlestickSeries({
      upColor: '${upColor}', downColor: '${downColor}',
      wickUpColor: '${upColor}', wickDownColor: '${downColor}',
      borderVisible: false,
    });
    cs.setData(${JSON.stringify(candleData)});
    const vs = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: '', color: '#3f3f46' });
    vs.priceScale().applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } });
    vs.setData(${JSON.stringify(volumeData)});
    chart.timeScale().fitContent();
  `;
  return renderHtml(buildHtml(script), outPath);
}

// ---- RSI line chart with overbought / oversold zones ----

export async function renderRsiChart(
  candles: Candle[],
  outPath: string,
  opts: { title: string; subtitle?: string; period?: number },
): Promise<string> {
  const period = opts.period ?? 14;
  const closes = candles.map((c) => c.close);
  const rsiVals = calcRsi(closes, period);
  const data = candles
    .map((c, i) => ({ time: c.time, value: rsiVals[i] }))
    .filter((p) => Number.isFinite(p.value));

  const script = `
    document.getElementById('title').textContent = ${JSON.stringify(opts.title)};
    document.getElementById('subtitle').textContent = ${JSON.stringify(opts.subtitle ?? `RSI(${period})`)};
    const chart = LightweightCharts.createChart(document.getElementById('chart'), {
      width: ${W}, height: ${H}, ...${COMMON_OPTIONS},
      rightPriceScale: { borderColor: '#27272a', scaleMargins: { top: 0.05, bottom: 0.05 } },
    });
    const line = chart.addLineSeries({ color: '#a78bfa', lineWidth: 2, priceLineVisible: false });
    line.setData(${JSON.stringify(data)});
    // Overbought / oversold zones
    line.createPriceLine({ price: 70, color: '#ef4444', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'OB 70' });
    line.createPriceLine({ price: 30, color: '#22c55e', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'OS 30' });
    line.createPriceLine({ price: 50, color: '#52525b', lineWidth: 1, lineStyle: 3, axisLabelVisible: false });
    chart.priceScale('right').applyOptions({ autoScale: false });
    chart.timeScale().fitContent();
    // Force visible range 0-100
    line.applyOptions({ autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }) });
  `;
  return renderHtml(buildHtml(script), outPath);
}

// ---- MACD: line + signal + histogram ----

export async function renderMacdChart(
  candles: Candle[],
  outPath: string,
  opts: { title: string; subtitle?: string },
): Promise<string> {
  const closes = candles.map((c) => c.close);
  const m = calcMacd(closes);
  const macdData = candles.map((c, i) => ({ time: c.time, value: m.macd[i] })).filter((p) => Number.isFinite(p.value));
  const signalData = candles.map((c, i) => ({ time: c.time, value: m.signal[i] })).filter((p) => Number.isFinite(p.value));
  const histData = candles.map((c, i) => ({
    time: c.time,
    value: m.histogram[i],
    color: m.histogram[i] >= 0 ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)",
  })).filter((p) => Number.isFinite(p.value));

  const script = `
    document.getElementById('title').textContent = ${JSON.stringify(opts.title)};
    document.getElementById('subtitle').textContent = ${JSON.stringify(opts.subtitle ?? "MACD(12,26,9)")};
    const chart = LightweightCharts.createChart(document.getElementById('chart'), { width: ${W}, height: ${H}, ...${COMMON_OPTIONS} });
    const hist = chart.addHistogramSeries({});
    hist.setData(${JSON.stringify(histData)});
    const macdLine = chart.addLineSeries({ color: '#3b82f6', lineWidth: 2, priceLineVisible: false });
    macdLine.setData(${JSON.stringify(macdData)});
    const sigLine = chart.addLineSeries({ color: '#f59e0b', lineWidth: 2, priceLineVisible: false });
    sigLine.setData(${JSON.stringify(signalData)});
    chart.timeScale().fitContent();
  `;
  return renderHtml(buildHtml(script), outPath);
}

// ---- Funding rate history (bar chart, color-coded by sign) ----

export async function renderFundingChart(
  funding: FundingPoint[],
  outPath: string,
  opts: { title: string; subtitle?: string },
): Promise<string> {
  // Render as percent for readability (rate * 100)
  const data = funding.map((p) => ({
    time: p.time,
    value: p.rate * 100,
    color: p.rate >= 0 ? "rgba(34,197,94,0.85)" : "rgba(239,68,68,0.85)",
  }));
  const script = `
    document.getElementById('title').textContent = ${JSON.stringify(opts.title)};
    document.getElementById('subtitle').textContent = ${JSON.stringify(opts.subtitle ?? "Funding Rate (%) — every 8h")};
    const chart = LightweightCharts.createChart(document.getElementById('chart'), { width: ${W}, height: ${H}, ...${COMMON_OPTIONS} });
    const s = chart.addHistogramSeries({ priceFormat: { type: 'price', precision: 4, minMove: 0.0001 } });
    s.setData(${JSON.stringify(data)});
    s.createPriceLine({ price: 0, color: '#52525b', lineWidth: 1, lineStyle: 0, axisLabelVisible: false });
    chart.timeScale().fitContent();
  `;
  return renderHtml(buildHtml(script), outPath);
}

// ---- Open Interest history (line chart in USD) ----

export async function renderOiChart(
  oi: OiPoint[],
  outPath: string,
  opts: { title: string; subtitle?: string; useValue?: boolean },
): Promise<string> {
  const useValue = opts.useValue ?? true;
  const data = oi.map((p) => ({
    time: p.time,
    value: useValue ? p.oiValue / 1e6 : p.oi,   // millions of USDT, or coin units
  }));
  const script = `
    document.getElementById('title').textContent = ${JSON.stringify(opts.title)};
    document.getElementById('subtitle').textContent = ${JSON.stringify(opts.subtitle ?? (useValue ? "Open Interest (USD, millions)" : "Open Interest (coin units)"))};
    const chart = LightweightCharts.createChart(document.getElementById('chart'), { width: ${W}, height: ${H}, ...${COMMON_OPTIONS} });
    const area = chart.addAreaSeries({
      lineColor: '#06b6d4', topColor: 'rgba(6,182,212,0.4)', bottomColor: 'rgba(6,182,212,0.02)',
      lineWidth: 2, priceLineVisible: false,
    });
    area.setData(${JSON.stringify(data)});
    chart.timeScale().fitContent();
  `;
  return renderHtml(buildHtml(script), outPath);
}

// ---- Long/Short ratio (line chart) ----

export async function renderLongShortChart(
  ls: LsPoint[],
  outPath: string,
  opts: { title: string; subtitle?: string },
): Promise<string> {
  const data = ls.map((p) => ({ time: p.time, value: p.ratio }));
  const script = `
    document.getElementById('title').textContent = ${JSON.stringify(opts.title)};
    document.getElementById('subtitle').textContent = ${JSON.stringify(opts.subtitle ?? "Top Trader Long/Short Position Ratio")};
    const chart = LightweightCharts.createChart(document.getElementById('chart'), { width: ${W}, height: ${H}, ...${COMMON_OPTIONS} });
    const line = chart.addLineSeries({ color: '#f59e0b', lineWidth: 2, priceLineVisible: false });
    line.setData(${JSON.stringify(data)});
    line.createPriceLine({ price: 1, color: '#52525b', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'Neutral 1.0' });
    chart.timeScale().fitContent();
  `;
  return renderHtml(buildHtml(script), outPath);
}
