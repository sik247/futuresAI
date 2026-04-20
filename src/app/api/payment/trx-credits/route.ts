import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { verifyTronNativeTransfer } from "@/lib/services/payment/tron-verify-trx.service";
import {
  TRX_PRODUCTS,
  TRX_REFILL_MIN,
  TRX_REFILL_MAX,
  resolveProduct,
  type TrxProductKey,
} from "@/lib/constants/trx-products";

export const dynamic = "force-dynamic";

const TXID_REGEX = /^[0-9a-fA-F]{64}$/;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  let product: string;
  let txid: string;
  let trxAmount: number | undefined;
  try {
    const body = await req.json();
    product = String(body.product ?? "");
    txid = String(body.txid ?? "").trim();
    trxAmount = body.trxAmount != null ? Number(body.trxAmount) : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const productConfig = resolveProduct(product);
  if (!productConfig) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  if (!TXID_REGEX.test(txid)) {
    return NextResponse.json(
      { error: "Invalid TXID format. Must be 64-character hex." },
      { status: 400 },
    );
  }

  // Required TRX amount:
  //   - CHART_SINGLE / CHAT_PACK_10: fixed price from the product table
  //   - TRX_REFILL: user chooses amount within MIN..MAX
  let requiredTrx: number;
  if (productConfig.key === "TRX_REFILL") {
    if (!trxAmount || !Number.isFinite(trxAmount)) {
      return NextResponse.json({ error: "trxAmount required for refill" }, { status: 400 });
    }
    if (trxAmount < TRX_REFILL_MIN || trxAmount > TRX_REFILL_MAX) {
      return NextResponse.json(
        { error: `Refill must be between ${TRX_REFILL_MIN} and ${TRX_REFILL_MAX} TRX` },
        { status: 400 },
      );
    }
    requiredTrx = trxAmount;
  } else {
    requiredTrx = productConfig.trx;
  }

  // Duplicate TXID guard — schema already enforces @unique so this also races safely.
  const existing = await prisma.payment.findUnique({ where: { txid } });
  if (existing) {
    return NextResponse.json({ error: "TXID already submitted" }, { status: 409 });
  }

  const walletAddress = process.env.PAYMENT_WALLET_TRC20 || process.env.PAYMENT_WALLET_ADDRESS || "";
  if (!walletAddress) {
    return NextResponse.json({ error: "Payment wallet not configured" }, { status: 500 });
  }

  // Create PENDING record first so even failed verifications leave an audit trail.
  const payment = await prisma.payment.create({
    data: {
      userId,
      txid,
      amount: requiredTrx,
      network: "TRON",
      currency: "TRX",
      productType: productConfig.key,
      status: "PENDING",
    },
  });

  const result = await verifyTronNativeTransfer(txid, walletAddress, requiredTrx);

  if (!result.verified) {
    return NextResponse.json({
      ok: true,
      status: "PENDING",
      message: result.error
        ? `Payment submitted. Auto-verification failed: ${result.error} An admin will review manually.`
        : "Payment submitted and pending verification.",
      paymentId: payment.id,
    });
  }

  // Verified — atomically credit the user and flip payment status.
  const actualTrx = result.amount;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "VERIFIED",
        verifiedAt: now,
        creditsAdded:
          productConfig.key === "TRX_REFILL"
            ? 0
            : productConfig.chartCredits + productConfig.chatCredits,
        trxAdded: productConfig.key === "TRX_REFILL" ? actualTrx : 0,
      },
    });

    if (productConfig.key === "TRX_REFILL") {
      await tx.user.update({
        where: { id: userId },
        data: { trxBalance: { increment: actualTrx } },
      });
    } else {
      await tx.user.update({
        where: { id: userId },
        data: {
          chartCreditsRemaining: { increment: productConfig.chartCredits },
          chatCreditsRemaining: { increment: productConfig.chatCredits },
        },
      });
    }
  });

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    select: { chartCreditsRemaining: true, chatCreditsRemaining: true, trxBalance: true },
  });

  return NextResponse.json({
    ok: true,
    status: "VERIFIED",
    product: productConfig.key,
    message:
      productConfig.key === "TRX_REFILL"
        ? `Deposit verified — +${actualTrx} TRX added to your wallet.`
        : productConfig.key === "CHART_SINGLE"
          ? "Payment verified — 1 chart reading added."
          : "Payment verified — 10 chat messages added.",
    trxPaid: actualTrx,
    balances: updated,
  });
}

// GET — list TRX-currency purchases for this user
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const payments = await prisma.payment.findMany({
    where: { userId, currency: "TRX" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      txid: true,
      amount: true,
      productType: true,
      creditsAdded: true,
      trxAdded: true,
      status: true,
      verifiedAt: true,
      adminNote: true,
      createdAt: true,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { chartCreditsRemaining: true, chatCreditsRemaining: true, trxBalance: true },
  });

  return NextResponse.json({
    payments,
    balances: user,
    products: TRX_PRODUCTS,
  });
}
