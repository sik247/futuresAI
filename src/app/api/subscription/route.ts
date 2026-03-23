import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  getActiveSubscription,
  checkUsageAllowance,
  createSubscription,
  cancelSubscription,
  MONTHLY_PRICE,
} from "@/lib/services/chart-analysis/subscription.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscription = await getActiveSubscription(user.id);
    if (!subscription) {
      return NextResponse.json({
        subscribed: false,
        allowed: false,
        credits: user.credits,
        price: MONTHLY_PRICE,
      });
    }

    const { allowed, periodEnd } = await checkUsageAllowance(user.id);

    return NextResponse.json({
      subscribed: true,
      allowed,
      periodEnd,
      credits: user.credits,
      price: MONTHLY_PRICE,
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already subscribed
    const existing = await getActiveSubscription(user.id);
    if (existing) {
      return NextResponse.json(
        { error: "Already subscribed" },
        { status: 400 }
      );
    }

    // Check credits
    if (user.credits < MONTHLY_PRICE) {
      return NextResponse.json(
        { error: "Insufficient credits", required: MONTHLY_PRICE },
        { status: 400 }
      );
    }

    const subscription = await createSubscription(user.id);

    return NextResponse.json({
      subscribed: true,
      periodEnd: subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error("Subscription create error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await cancelSubscription(user.id);

    return NextResponse.json({ subscribed: false });
  } catch (error) {
    console.error("Subscription cancel error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
