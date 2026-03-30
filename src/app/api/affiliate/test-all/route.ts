import { bitgetService } from "@/lib/services/exchanges/bitget.service";
import { byBitService } from "@/lib/services/exchanges/bybit.service";
import { bingXService } from "@/lib/services/exchanges/bingx.service";
import { okxService } from "@/lib/services/exchanges/okx.service";
import { gateService } from "@/lib/services/exchanges/gate.service";
import { htxService } from "@/lib/services/exchanges/htx.service";

async function testExchange(name: string, fn: () => Promise<any>) {
  try {
    const start = Date.now();
    const data = await fn();
    const duration = Date.now() - start;
    return { exchange: name, ok: true, duration: `${duration}ms`, data };
  } catch (error: any) {
    return { exchange: name, ok: false, error: error.message };
  }
}

export async function GET() {
  const results = await Promise.allSettled([
    testExchange("bitget", () =>
      bitgetService.getAffiliateData("7933563491")
    ),
    testExchange("bybit", () =>
      byBitService.getAffiliateData("2391021")
    ),
    testExchange("bingx", async () => {
      const { data } = await bingXService.getAffiliateData("26029939", new Date());
      return JSON.parse(data);
    }),
    testExchange("okx", () =>
      okxService.getAffiliateData("594436422380389965")
    ),
    testExchange("gate", () =>
      gateService.getAffiliateData("COINBASE")
    ),
    testExchange("htx", () =>
      htxService.getAffiliateData("miqkc223")
    ),
  ]);

  const data = results.map((r) =>
    r.status === "fulfilled" ? r.value : { ok: false, error: r.reason?.message }
  );

  return Response.json({ timestamp: new Date().toISOString(), results: data });
}
