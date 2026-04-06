import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { verifyTronTransaction } from "@/lib/services/payment/tron-verify.service";

export const dynamic = "force-dynamic";

const PAYMENT_AMOUNT = 99;
const TXID_REGEX = /^[0-9a-fA-F]{64}$/;

/* ------------------------------------------------------------------ */
/*  POST /api/payment  — submit TXID for verification                  */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  let txid: string;
  try {
    const body = await req.json();
    txid = (body.txid ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!TXID_REGEX.test(txid)) {
    return NextResponse.json({ error: "Invalid TXID format (must be 64 hex characters)" }, { status: 400 });
  }

  // Check if TXID already used
  const existing = await prisma.payment.findUnique({ where: { txid } });
  if (existing) {
    return NextResponse.json({ error: "TXID already submitted" }, { status: 409 });
  }

  const walletAddress = process.env.PAYMENT_WALLET_ADDRESS;
  if (!walletAddress) {
    return NextResponse.json({ error: "Payment wallet not configured" }, { status: 500 });
  }

  // Create PENDING record first
  const payment = await prisma.payment.create({
    data: {
      userId,
      txid,
      amount: PAYMENT_AMOUNT,
      network: "TRC20",
      status: "PENDING",
    },
  });

  // Attempt auto-verification via TronScan
  const result = await verifyTronTransaction(txid, walletAddress, PAYMENT_AMOUNT);

  if (result.verified) {
    // Atomically verify payment + activate premium
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
          isPremium: true,
          chatEnabled: true,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      status: "VERIFIED",
      message: "Payment verified! Premium activated.",
      amount: result.amount,
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
