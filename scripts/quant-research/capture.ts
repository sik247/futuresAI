/**
 * Captures a clean TradingView 4H chart screenshot using the widget-embed URL
 * (no watchlist sidebar, no drawing-tools rail, no header).
 *
 * Usage from another script:
 *   import { captureChart } from "./capture";
 *   const out = await captureChart({ pair: "ZECUSDT.P", interval: "240", outDir });
 *
 * CLI:
 *   npx tsx scripts/quant-research/capture.ts BTCUSDT.P,ETHUSDT.P --tf 240
 */
import { chromium, type Browser, type Page } from "playwright";
import path from "path";
import fs from "fs/promises";

export type CaptureResult = {
  pair: string;          // e.g. "ZECUSDT.P"
  symbol: string;        // e.g. "ZEC"
  interval: string;      // e.g. "240"
  filePath: string;      // absolute path on disk
  publicPath: string;    // /images/blog/...
  publicUrl: string;     // https://futuresai.io/images/blog/...
};

const SITE_URL = "https://futuresai.io";
const VIEWPORT = { width: 1600, height: 900 };

function todayStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function symbolFromPair(pair: string): string {
  // "ZECUSDT.P" -> "ZEC", "BTCUSDT" -> "BTC"
  return pair.replace(/USDT(\.P)?$/i, "").toUpperCase();
}

function intervalSlug(interval: string): string {
  // TradingView's interval values: "240"=4h, "1D"=1d, "1W"=1w, "60"=1h
  switch (interval) {
    case "240": return "4h";
    case "60": return "1h";
    case "1D": case "D": return "1d";
    case "1W": case "W": return "1w";
    case "1M": case "M": return "1m";
    default: return interval.toLowerCase();
  }
}

async function dismissOverlays(page: Page) {
  // TradingView occasionally shows cookie banners or "register" CTAs in embeds.
  // Best-effort: click any visible close buttons via aria-label, then escape.
  await page.evaluate(() => {
    const close = document.querySelectorAll<HTMLElement>(
      '[aria-label="Close" i], [data-name="close"], button[class*="close" i]',
    );
    close.forEach((el) => el.click());
  });
  await page.keyboard.press("Escape").catch(() => {});
}

async function waitForChartReady(page: Page) {
  // The TV widget renders into a large <canvas>. Wait for any canvas with
  // non-trivial dimensions to appear, then a small settle delay.
  await page.waitForFunction(
    () => {
      const canvases = Array.from(document.querySelectorAll("canvas"));
      return canvases.some((c) => c.width > 800 && c.height > 400);
    },
    { timeout: 30_000 },
  );
  await page.waitForTimeout(2_500);
}

async function capturePair(
  browser: Browser,
  pair: string,
  interval: string,
  outDir: string,
): Promise<CaptureResult> {
  const symbol = symbolFromPair(pair);
  const stamp = todayStamp();
  const tfSlug = intervalSlug(interval);
  const fileName = `${symbol.toLowerCase()}-${tfSlug}-chart-${stamp}.png`;
  const filePath = path.join(outDir, fileName);
  const publicPath = `/images/blog/${fileName}`;
  const publicUrl = `${SITE_URL}${publicPath}`;

  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,    // sharp chart pixels for Telegram
    colorScheme: "dark",
    locale: "en-US",
  });
  const page = await ctx.newPage();

  // Widget-embed URL: minimal chrome, supports BINANCE:XYZ.P perp symbols
  const tvUrl =
    `https://s.tradingview.com/widgetembed/?` +
    `symbol=${encodeURIComponent(`BINANCE:${pair}`)}` +
    `&interval=${interval}` +
    `&theme=dark` +
    `&style=1` +
    `&hide_top_toolbar=1` +
    `&hide_side_toolbar=1` +
    `&allow_symbol_change=0` +
    `&save_image=0` +
    `&studies=%5B%5D` +
    `&hide_legend=0` +
    `&withdateranges=0`;

  console.log(`[capture] ${pair} → ${fileName}`);
  await page.goto(tvUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await dismissOverlays(page);
  await waitForChartReady(page);
  await dismissOverlays(page);

  await fs.mkdir(outDir, { recursive: true });
  await page.screenshot({ path: filePath, type: "png", fullPage: false });

  await ctx.close();
  return { pair, symbol, interval, filePath, publicPath, publicUrl };
}

export async function captureCharts(opts: {
  pairs: string[];
  interval?: string;
  intervals?: string[];
  outDir?: string;
}): Promise<CaptureResult[]> {
  const intervals = opts.intervals ?? [opts.interval ?? "240"];
  const outDir =
    opts.outDir ?? path.resolve(process.cwd(), "public/images/blog");

  const browser = await chromium.launch({ headless: true });
  try {
    const results: CaptureResult[] = [];
    for (const pair of opts.pairs) {
      for (const interval of intervals) {
        try {
          results.push(await capturePair(browser, pair, interval, outDir));
        } catch (err) {
          console.error(`[capture] ${pair}@${interval} failed:`, err);
        }
      }
    }
    return results;
  } finally {
    await browser.close();
  }
}

// ----- CLI entry -----
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("usage: tsx capture.ts BTCUSDT.P,ETHUSDT.P [--tf 240[,1D,1W]]");
    process.exit(1);
  }
  const pairs = args[0].split(",").map((s) => s.trim()).filter(Boolean);
  const tfIdx = args.indexOf("--tf");
  const intervals = tfIdx >= 0
    ? args[tfIdx + 1].split(",").map((s) => s.trim()).filter(Boolean)
    : ["240"];

  const results = await captureCharts({ pairs, intervals });
  console.log(JSON.stringify(results, null, 2));
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
