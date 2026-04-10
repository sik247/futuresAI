import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { verifyTronTransaction } from "@/lib/services/payment/tron-verify.service";

export const dynamic = "force-dynamic";

const TIERS = {
  25: { tier: "BASIC", isPremium: false, credits: 25, chatEnabled: true },
  99: { tier: "PREMIUM", isPremium: true, credits: 99, chatEnabled: true },
} as const;

// TRC-20 TXID: 64 hex characters
const TXID_TRC20_REGEX = /^[0-9a-fA-F]{64}$/;

/* ------------------------------------------------------------------ */
/*  POST /api/payment  — submit TXID for verification (TRC-20 only)    */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  let txid: string;
  let planAmount: number;
  try {
    const body = await req.json();
    txid = (body.txid ?? "").trim();
    planAmount = body.amount ?? 99;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate plan amount
  if (planAmount !== 25 && planAmount !== 99) {
    return NextResponse.json({ error: "Invalid plan amount. Choose $25 or $99." }, { status: 400 });
  }

  // Validate TRC-20 TXID format
  if (!TXID_TRC20_REGEX.test(txid)) {
    return NextResponse.json({ error: "Invalid TXID format. Must be 64-character hex (TRC-20)." }, { status: 400 });
  }

  // Check if TXID already used
  const existing = await prisma.payment.findUnique({ where: { txid } });
  if (existing) {
    return NextResponse.json({ error: "TXID already submitted" }, { status: 409 });
  }

  // Get TRC-20 wallet address
  const walletAddress = process.env.PAYMENT_WALLET_TRC20 || process.env.PAYMENT_WALLET_ADDRESS || "";
  if (!walletAddress) {
    return NextResponse.json({ error: "Payment wallet not configured" }, { status: 500 });
  }

  // Create PENDING record
  const payment = await prisma.payment.create({
    data: {
      userId,
      txid,
      amount: planAmount,
      network: "TRC20",
      status: "PENDING",
    },
  });

  // Verify transaction on TRON blockchain
  const result = await verifyTronTransaction(txid, walletAddress, planAmount);

  if (result.verified) {
    const tierConfig = TIERS[planAmount as 25 | 99];

    // Atomically verify payment + activate subscription
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: tierConfig.isPremium,
          credits: tierConfig.credits,
          chatEnabled: tierConfig.chatEnabled,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      status: "VERIFIED",
      tier: tierConfig.tier,
      message: `Payment verified! ${tierConfig.tier} plan activated.`,
      amount: result.amount,
      network: "TRC20",
    });
  }

  // Not yet verified — stays PENDING for admin review
  return NextResponse.json({
    ok: true,
    status: "PENDING",
    message: result.error
      ? `Payment submitted. Auto-verification failed: ${result.error}. An admin will review manually.`
      : "Payment submitted and pending verification.",
    paymentId: payment.id,
    network: "TRC20",
  });
}

/* ------------------------------------------------------------------ */
/*  GET /api/payment  — get current user's payment history             */
/* ------------------------------------------------------------------ */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      txid: true,
      amount: true,
      network: true,
      status: true,
      verifiedAt: true,
      adminNote: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ payments });
}
