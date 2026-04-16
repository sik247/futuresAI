import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { gateService } from "@/lib/services/exchanges/gate.service";

export const dynamic = "force-dynamic";

/**
 * Admin endpoint: Get all Gate.io referred users with their commissions and fees.
 * Aggregates partner/commission_history per user_id.
 *
 * GET /api/admin/gate-users?from=1712000000&to=1714600000
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fromParam = req.nextUrl.searchParams.get("from");
  const toParam = req.nextUrl.searchParams.get("to");

  const now = Math.floor(Date.now() / 1000);
  const from = fromParam ? parseInt(fromParam) : now - 30 * 24 * 60 * 60;
  const to = toParam ? parseInt(toParam) : now;

  try {
    // Fetch sub list (all referred users)
    const subList = await gateService.getPartnerSubList();
    const subMap = new Map<number, { joinTime: number; type: number }>();
    if (subList.ok && subList.users) {
      for (const u of subList.users) {
        subMap.set(u.user_id, { joinTime: u.user_join_time, type: u.type });
      }
    }

    // Fetch all commissions for the period (paginated — up to 1000)
    const commissions = await fetchAllPages(
      "/api/v4/rebate/partner/commission_history",
      from, to
    );

    // Fetch all transactions for the period (user trading fees)
    const transactions = await fetchAllPages(
      "/api/v4/rebate/partner/transaction_history",
      from, to
    );

    // Aggregate per user
    const userMap = new Map<string, {
      userId: string;
      commission: number;
      commissionCount: number;
      fees: number;
      volume: number;
      feeCount: number;
      joinDate: string | null;
    }>();

    for (const c of commissions) {
      const uid = String(c.user_id);
      const existing = userMap.get(uid) || {
        userId: uid,
        commission: 0,
        commissionCount: 0,
        fees: 0,
        volume: 0,
        feeCount: 0,
        joinDate: null,
      };
      existing.commission += parseFloat(c.commission_amount || "0");
      existing.commissionCount++;
      const sub = subMap.get(c.user_id);
      if (sub) existing.joinDate = new Date(sub.joinTime * 1000).toISOString().slice(0, 10);
      userMap.set(uid, existing);
    }

    for (const t of transactions) {
      const uid = String(t.user_id);
      const existing = userMap.get(uid) || {
        userId: uid,
        commission: 0,
        commissionCount: 0,
        fees: 0,
        volume: 0,
        feeCount: 0,
        joinDate: null,
      };
      existing.fees += parseFloat(t.fee || "0");
      existing.volume += Math.abs(parseFloat(t.amount || "0"));
      existing.feeCount++;
      const sub = subMap.get(t.user_id);
      if (sub && !existing.joinDate) existing.joinDate = new Date(sub.joinTime * 1000).toISOString().slice(0, 10);
      userMap.set(uid, existing);
    }

    const users = Array.from(userMap.values())
      .sort((a, b) => b.commission - a.commission);

    const totalCommission = users.reduce((s, u) => s + u.commission, 0);
    const totalFees = users.reduce((s, u) => s + u.fees, 0);
    const totalVolume = users.reduce((s, u) => s + u.volume, 0);

    return NextResponse.json({
      exchange: "Gate.io",
      period: { from, to },
      summary: {
        totalReferrals: subList.ok ? subList.total : 0,
        activeUsers: users.length,
        totalCommission,
        totalFees,
        totalVolume,
        commissionEntries: commissions.length,
        transactionEntries: transactions.length,
      },
      users,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Fetch up to 1000 entries with pagination (Gate.io max per page is 100) */
async function fetchAllPages(path: string, from: number, to: number) {
  const CryptoJS = (await import("crypto-js")).default;
  const baseUrl = "https://api.gateio.ws";
  const apiKey = process.env.GATE_API_KEY!;
  const apiSecret = process.env.GATE_API_SECRET!;
  const all: any[] = [];
  let offset = 0;
  const limit = 100;

  for (let page = 0; page < 10; page++) {
    const query = `from=${from}&to=${to}&limit=${limit}&offset=${offset}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const hashedBody = CryptoJS.SHA512("").toString();
    const signString = `GET\n${path}\n${query}\n${hashedBody}\n${timestamp}`;
    const signature = CryptoJS.HmacSHA512(signString, apiSecret).toString();

    const res = await fetch(`${baseUrl}${path}?${query}`, {
      headers: { KEY: apiKey, SIGN: signature, Timestamp: timestamp, "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!data || !Array.isArray(data.list) || data.list.length === 0) break;
    all.push(...data.list);
    if (all.length >= data.total || data.list.length < limit) break;
    offset += limit;
  }

  return all;
}
