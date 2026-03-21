import { bitgetService } from "@/lib/services/exchanges/bitget.service";

export async function GET() {
  try {
    const response = await bitgetService.getAffiliateData("7933563491");
    return Response.json({ ok: true, exchange: "bitget", data: response });
  } catch (error: any) {
    return Response.json(
      { ok: false, exchange: "bitget", error: error.message },
      { status: 500 }
    );
  }
}
