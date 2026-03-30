import { htxService } from "@/lib/services/exchanges/htx.service";

export async function GET() {
  try {
    const data = await htxService.getAffiliateData("miqkc223");
    return Response.json({ ok: true, exchange: "htx", data });
  } catch (error: any) {
    return Response.json(
      { ok: false, exchange: "htx", error: error.message },
      { status: 500 }
    );
  }
}
