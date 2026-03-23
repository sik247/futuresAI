import { auth } from "@/auth";
import { bitgetService } from "@/lib/services/exchanges/bitget.service";
import { byBitService } from "@/lib/services/exchanges/bybit.service";
import { bingXService } from "@/lib/services/exchanges/bingx.service";
import { okxService } from "@/lib/services/exchanges/okx.service";

interface ExchangeResult {
  exchange: string;
  account: string;
  status: "ok" | "error" | "no_permission";
  totalPayback: number;
  entries: number;
  error?: string;
  rawData?: any;
}

async function fetchBitget(): Promise<ExchangeResult> {
  try {
    const data = await bitgetService.getAffiliateData("7933563491");
    const total = data.reduce((sum: number, item: any) => sum + (item.payback || 0), 0);
    return {
      exchange: "Bitget",
      account: "base03",
      status: "ok",
      totalPayback: total,
      entries: data.length,
    };
  } catch (error: any) {
    return {
      exchange: "Bitget",
      account: "base03",
      status: "error",
      totalPayback: 0,
      entries: 0,
      error: error.message,
    };
  }
}

async function fetchBybit(): Promise<ExchangeResult> {
  try {
    const response = await byBitService.getAffiliateData("2391021");
    if (response.retCode === 10005) {
      return {
        exchange: "Bybit",
        account: "BBLL",
        status: "no_permission",
        totalPayback: 0,
        entries: 0,
        error: "API key needs Affiliate permission enabled",
      };
    }
    return {
      exchange: "Bybit",
      account: "BBLL",
      status: "ok",
      totalPayback: 0,
      entries: 0,
      rawData: response,
    };
  } catch (error: any) {
    return {
      exchange: "Bybit",
      account: "BBLL",
      status: "error",
      totalPayback: 0,
      entries: 0,
      error: error.message,
    };
  }
}

async function fetchBingX(): Promise<ExchangeResult> {
  try {
    const { data } = await bingXService.getAffiliateData("26029939", new Date());
    const parsed = JSON.parse(data);
    if (parsed.code !== 0) {
      return {
        exchange: "BingX",
        account: "FCC9QDJK",
        status: "error",
        totalPayback: 0,
        entries: 0,
        error: parsed.msg || `API error code: ${parsed.code}`,
      };
    }
    const list = parsed.data?.list || [];
    const total = list.reduce((sum: number, item: any) => sum + parseFloat(item.commission || "0"), 0);
    return {
      exchange: "BingX",
      account: "FCC9QDJK",
      status: "ok",
      totalPayback: total,
      entries: list.length,
    };
  } catch (error: any) {
    return {
      exchange: "BingX",
      account: "FCC9QDJK",
      status: "error",
      totalPayback: 0,
      entries: 0,
      error: error.message,
    };
  }
}

async function fetchOkx(): Promise<ExchangeResult> {
  try {
    const data = await okxService.getAffiliateData("594436422380389965");
    return {
      exchange: "OKX",
      account: "COINBASE",
      status: data.ok ? "ok" : "error",
      totalPayback: data.payback || 0,
      entries: data.ok ? 1 : 0,
      error: data.ok ? undefined : "API returned error",
    };
  } catch (error: any) {
    return {
      exchange: "OKX",
      account: "COINBASE",
      status: "error",
      totalPayback: 0,
      entries: 0,
      error: error.message,
    };
  }
}

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await Promise.allSettled([
    fetchBitget(),
    fetchBybit(),
    fetchBingX(),
    fetchOkx(),
  ]);

  const exchanges = results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { exchange: "Unknown", account: "", status: "error" as const, totalPayback: 0, entries: 0, error: r.reason?.message }
  );

  const grandTotal = exchanges.reduce((sum, e) => sum + e.totalPayback, 0);
  const healthyCount = exchanges.filter((e) => e.status === "ok").length;

  return Response.json({
    timestamp: new Date().toISOString(),
    summary: {
      grandTotal,
      healthyExchanges: healthyCount,
      totalExchanges: exchanges.length,
    },
    exchanges,
  });
}
