import { byBitService } from "@/lib/services/exchanges/bybit.service";

export async function GET() {
  try {
    const data = await byBitService.getAffiliateData("2391021");
    return Response.json({ ok: true, exchange: "bybit", data });
  } catch (error: any) {
    return Response.json(
      { ok: false, exchange: "bybit", error: error.message },
      { status: 500 }
    );
  }
}
