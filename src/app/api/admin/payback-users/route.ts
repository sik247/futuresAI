import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import CryptoJS from "crypto-js";

export const dynamic = "force-dynamic";
export const maxDuration = 55;

/**
 * Admin endpoint: Unified payback dashboard data across ALL exchanges.
 * Returns per-user breakdown from live APIs + DB data.
 *
 * GET /api/admin/payback-users?from=1712000000&to=1714600000
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fromParam = req.nextUrl.searchParams.get("from");
  const toParam = req.nextUrl.searchParams.get("to");
  const now = Math.floor(Date.now() / 1000);
  const from = fromParam ? parseInt(fromParam) : now - 30 * 86400;
  const to = toParam ? parseInt(toParam) : now;

  try {
    // Fetch all data in parallel
    const [gateData, dbAccounts] = await Promise.all([
      fetchGatePartnerData(from, to),
      fetchDbAccounts(),
    ]);

    // Merge all users into unified list
    const userMap = new Map<string, {
      uid: string;
      exchange: string;
      commission: number;
      paybackRate: number;
      paybackOwed: number;
      fees: number;
      volume: number;
      trades: number;
      joinDate: string | null;
      email: string | null;
      dbStatus: string | null;
    }>();

    // Gate.io users (from live API)
    for (const u of gateData.users) {
      userMap.set(`gate:${u.userId}`, {
        uid: u.userId,
        exchange: "Gate.io",
        commission: u.commission,
        paybackRate: 0.75,
        paybackOwed: u.commission * 0.75,
        fees: u.fees,
        volume: u.volume,
        trades: u.trades,
        joinDate: u.joinDate,
        email: null,
        dbStatus: null,
      });
    }

    // DB accounts (Bitget, BingX, etc.)
    for (const acc of dbAccounts) {
      const key = `${acc.exchangeName.toLowerCase()}:${acc.uid}`;
      userMap.set(key, {
        uid: acc.uid,
        exchange: acc.exchangeName,
        commission: acc.totalEarned,
        paybackRate: acc.paybackRate,
        paybackOwed: acc.unpaid,
        fees: 0, // DB doesn't store user fees
        volume: 0,
        trades: acc.tradeCount,
        joinDate: acc.createdAt,
        email: acc.userEmail,
        dbStatus: acc.status,
      });
    }

    const users = Array.from(userMap.values())
      .sort((a, b) => b.commission - a.commission);

    // Summary
    const byExchange: Record<string, { commission: number; payback: number; fees: number; users: number }> = {};
    for (const u of users) {
      const e = byExchange[u.exchange] || { commission: 0, payback: 0, fees: 0, users: 0 };
      e.commission += u.commission;
      e.payback += u.paybackOwed;
      e.fees += u.fees;
      e.users++;
      byExchange[u.exchange] = e;
    }

    return NextResponse.json({
      period: { from, to },
      summary: {
        totalUsers: users.length,
        totalCommission: users.reduce((s, u) => s + u.commission, 0),
        totalPaybackOwed: users.reduce((s, u) => s + u.paybackOwed, 0),
        totalFees: users.reduce((s, u) => s + u.fees, 0),
        totalVolume: users.reduce((s, u) => s + u.volume, 0),
        byExchange,
      },
      gateReferrals: gateData.totalReferrals,
      users,
    });
  } catch (error: any) {
    console.error("[payback-users]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ── Gate.io partner data ── */
async function fetchGatePartnerData(from: number, to: number) {
  const apiKey = process.env.GATE_API_KEY;
  const apiSecret = process.env.GATE_API_SECRET;
  if (!apiKey || !apiSecret) return { users: [], totalReferrals: 0 };

  const [commissions, transactions, subList] = await Promise.all([
    gatePages("/api/v4/rebate/partner/commission_history", from, to, apiKey, apiSecret),
    gatePages("/api/v4/rebate/partner/transaction_history", from, to, apiKey, apiSecret),
    gateRequest("/api/v4/rebate/partner/sub_list", "limit=100", apiKey, apiSecret),
  ]);

  const subMap = new Map<number, number>();
  if (subList?.list) {
    for (const s of subList.list) subMap.set(s.user_id, s.user_join_time);
  }

  const userMap = new Map<string, { userId: string; commission: number; fees: number; volume: number; trades: number; joinDate: string | null }>();

  for (const c of commissions) {
    const uid = String(c.user_id);
    const e = userMap.get(uid) || { userId: uid, commission: 0, fees: 0, volume: 0, trades: 0, joinDate: null };
    e.commission += parseFloat(c.commission_amount || "0");
    const jt = subMap.get(c.user_id);
    if (jt) e.joinDate = new Date(jt * 1000).toISOString().slice(0, 10);
    userMap.set(uid, e);
  }

  for (const t of transactions) {
    const uid = String(t.user_id);
    const e = userMap.get(uid) || { userId: uid, commission: 0, fees: 0, volume: 0, trades: 0, joinDate: null };
    e.fees += parseFloat(t.fee || "0");
    e.volume += Math.abs(parseFloat(t.amount || "0"));
    e.trades++;
    const jt = subMap.get(t.user_id);
    if (jt && !e.joinDate) e.joinDate = new Date(jt * 1000).toISOString().slice(0, 10);
    userMap.set(uid, e);
  }

  return {
    users: Array.from(userMap.values()),
    totalReferrals: subList?.total || 0,
  };
}

async function gatePages(path: string, from: number, to: number, apiKey: string, apiSecret: string) {
  const all: any[] = [];
  for (let offset = 0; offset < 1000; offset += 100) {
    const query = `from=${from}&to=${to}&limit=100&offset=${offset}`;
    const data = await gateRequest(path, query, apiKey, apiSecret);
    if (!data?.list?.length) break;
    all.push(...data.list);
    if (all.length >= data.total || data.list.length < 100) break;
  }
  return all;
}

async function gateRequest(path: string, query: string, apiKey: string, apiSecret: string) {
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = CryptoJS.HmacSHA512(`GET\n${path}\n${query}\n${CryptoJS.SHA512("").toString()}\n${ts}`, apiSecret).toString();
  const res = await fetch(`https://api.gateio.ws${path}?${query}`, {
    headers: { KEY: apiKey, SIGN: sig, Timestamp: ts, "Content-Type": "application/json" },
  });
  return res.json();
}

/* ── DB accounts (Bitget, BingX, Bybit, OKX, HTX) ── */
async function fetchDbAccounts() {
  const accounts = await prisma.exchangeAccount.findMany({
    include: {
      exchange: true,
      user: { select: { email: true, name: true } },
      trades: { where: { status: "SUCCESS" }, select: { payback: true, withdrawId: true } },
    },
  });

  return accounts.map((acc) => {
    const totalEarned = acc.trades.reduce((s, t) => s + t.payback, 0);
    const unpaid = acc.trades.filter((t) => !t.withdrawId).reduce((s, t) => s + t.payback, 0);
    return {
      uid: acc.uid,
      exchangeName: acc.exchange.name,
      paybackRate: acc.exchange.paybackRatio || 0,
      status: acc.status,
      userEmail: acc.user.email,
      totalEarned,
      unpaid,
      tradeCount: acc.trades.length,
      createdAt: acc.createdAt.toISOString().slice(0, 10),
    };
  });
}
