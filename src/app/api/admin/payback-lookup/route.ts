import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { bitgetService } from "@/lib/services/exchanges/bitget.service";
import { byBitService } from "@/lib/services/exchanges/bybit.service";
import { bingXService } from "@/lib/services/exchanges/bingx.service";
import { htxService } from "@/lib/services/exchanges/htx.service";
import { gateService } from "@/lib/services/exchanges/gate.service";
import { okxService } from "@/lib/services/exchanges/okx.service";

/**
 * Admin endpoint to look up payback/commission for a specific user on any exchange.
 *
 * GET /api/admin/payback-lookup?exchange=gate&uid=12345678
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exchange = req.nextUrl.searchParams.get("exchange")?.toLowerCase();
  const uid = req.nextUrl.searchParams.get("uid");

  if (!exchange || !uid) {
    return NextResponse.json(
      { error: "Missing fields", required: ["exchange", "uid"] },
      { status: 400 }
    );
  }

  try {
    let result: any;

    const type = req.nextUrl.searchParams.get("type"); // "fees" or "subs"

    switch (exchange) {
      case "gate":
      case "gate.io":
        if (type === "fees") {
          result = await gateService.getUserFees(uid);
        } else if (type === "subs") {
          result = await gateService.getPartnerSubList();
        } else {
          result = await gateService.getAffiliateData(uid);
        }
        break;
      case "bitget":
        result = await bitgetService.getAffiliateData(uid);
        result = { ok: true, payback: Array.isArray(result) ? result.reduce((s: number, i: any) => s + (i.payback || 0), 0) : 0, entries: Array.isArray(result) ? result.length : 0, raw: result };
        break;
      case "bybit":
        result = await byBitService.getAffiliateData(uid);
        result = { ok: result.retCode === 0, payback: parseFloat((result.result as any)?.totalCommission || "0"), raw: result.result };
        break;
      case "okx":
        result = await okxService.getAffiliateData(uid);
        break;
      case "bingx":
        const bingxData = await bingXService.getAffiliateData(uid, new Date());
        const parsed = JSON.parse(bingxData.data);
        const list = parsed.data?.list || [];
        result = { ok: parsed.code === 0, payback: list.reduce((s: number, i: any) => s + parseFloat(i.commission || "0"), 0), entries: list.length };
        break;
      case "htx":
        result = await htxService.getAffiliateData(uid);
        break;
      default:
        return NextResponse.json({ error: `Unknown exchange: ${exchange}` }, { status: 400 });
    }

    return NextResponse.json({
      exchange,
      uid,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error: any) {
    return NextResponse.json({
      exchange,
      uid,
      timestamp: new Date().toISOString(),
      result: { ok: false, error: error.message },
    }, { status: 500 });
  }
}
