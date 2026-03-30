import { gateService } from "@/lib/services/exchanges/gate.service";

export async function GET() {
  try {
    const data = await gateService.getAffiliateData("COINBASE");
    return Response.json({ ok: true, exchange: "gate", data });
  } catch (error: any) {
    return Response.json(
      { ok: false, exchange: "gate", error: error.message },
      { status: 500 }
    );
  }
}
