import { okxService } from "@/lib/services/exchanges/okx.service";

export async function GET() {
  try {
    const data = await okxService.getAffiliateData("594436422380389965");
    return Response.json({ ok: true, exchange: "okx", data });
  } catch (error: any) {
    return Response.json(
      { ok: false, exchange: "okx", error: error.message },
      { status: 500 }
    );
  }
}
