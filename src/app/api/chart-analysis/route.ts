import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { runMultiAgentAnalysis } from "@/lib/services/chart-analysis/orchestrator";
import {
  checkUsageAllowance,
  incrementUsage,
} from "@/lib/services/chart-analysis/subscription.service";
import {
  notifyAdmin,
  formatChartAnalysisNotification,
} from "@/lib/services/notifications/telegram.service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl, pair } = await req.json();
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }
    if (!pair) {
      return NextResponse.json(
        { error: "Trading pair is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check subscription & usage
    const { allowed, subscription, periodEnd } = await checkUsageAllowance(
      user.id
    );
    if (!subscription) {
      return NextResponse.json(
        { error: "Active subscription required", code: "NO_SUBSCRIPTION" },
        { status: 403 }
      );
    }
    if (!allowed) {
      return NextResponse.json(
        {
          error: "Analysis limit reached",
          code: "LIMIT_REACHED",
          periodEnd,
        },
        { status: 429 }
      );
    }

    // Run multi-agent analysis
    const { analysis, priceData, webResults } = await runMultiAgentAnalysis(
      imageUrl,
      pair
    );

    // Create analysis record (auto-charged for subscribers)
    const chartAnalysis = await prisma.chartAnalysis.create({
      data: {
        imageUrl,
        pair,
        cost: 0,
        status: "CHARGED",
        summary: analysis.summary,
        trend: analysis.trend,
        patterns: JSON.stringify(analysis.patterns),
        supportLevels: JSON.stringify(analysis.supportLevels),
        resistanceLevels: JSON.stringify(analysis.resistanceLevels),
        indicators: JSON.stringify(analysis.indicators),
        tradeSetup: JSON.stringify(analysis.tradeSetup),
        analysisData: JSON.stringify(analysis),
        newsContext: webResults ? JSON.stringify(webResults) : null,
        priceContext: priceData ? JSON.stringify(priceData) : null,
        riskScore: analysis.riskScore,
        confidence: analysis.confidence,
        userId: user.id,
        chargedAt: new Date(),
      },
    });

    // Increment usage count
    await incrementUsage(user.id);

    // Notify admin
    try {
      await notifyAdmin(
        formatChartAnalysisNotification({
          userName: user.name || user.nickname,
          trend: analysis.trend,
          confidence: analysis.confidence,
          cost: 0,
        })
      );
    } catch {
      // Don't fail if notification fails
    }

    return NextResponse.json({
      id: chartAnalysis.id,
      analysis,
      status: "CHARGED",
    });
  } catch (error) {
    console.error("Chart analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}

// Admin endpoint to approve/refund legacy analyses
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { analysisId, action } = await req.json();
    if (!analysisId || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const analysis = await prisma.chartAnalysis.findUnique({
      where: { id: analysisId },
      include: { user: true },
    });
    if (!analysis) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (action === "approve") {
      await prisma.$transaction([
        prisma.chartAnalysis.update({
          where: { id: analysisId },
          data: { status: "CHARGED", chargedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: analysis.userId },
          data: { credits: { decrement: analysis.cost } },
        }),
      ]);
      return NextResponse.json({ status: "CHARGED", cost: analysis.cost });
    } else if (action === "refund") {
      await prisma.chartAnalysis.update({
        where: { id: analysisId },
        data: { status: "REFUNDED" },
      });
      return NextResponse.json({ status: "REFUNDED" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Chart analysis admin error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Get user's analysis history
export async function GET(req: NextRequest) {
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

    const analyses = await prisma.chartAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const parsed = analyses.map((a) => ({
      ...a,
      patterns: JSON.parse(a.patterns),
      supportLevels: JSON.parse(a.supportLevels),
      resistanceLevels: JSON.parse(a.resistanceLevels),
      indicators: JSON.parse(a.indicators),
      tradeSetup: JSON.parse(a.tradeSetup),
    }));

    return NextResponse.json({ analyses: parsed, credits: user.credits });
  } catch (error) {
    console.error("Chart analysis fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
