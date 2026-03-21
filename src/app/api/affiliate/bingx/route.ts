import { bingXService } from "@/lib/services/exchanges/bingx.service";

export async function GET() {
  try {
    const date = new Date();
    const { data } = await bingXService.getAffiliateData("26029939", date);
    return Response.json({ ok: true, exchange: "bingx", data: JSON.parse(data) });
  } catch (error: any) {
    return Response.json(
      { ok: false, exchange: "bingx", error: error.message },
      { status: 500 }
    );
  }
}
