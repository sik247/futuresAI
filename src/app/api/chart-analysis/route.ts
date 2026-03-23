import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  analyzeChart,
  ANALYSIS_COST,
} from "@/lib/services/chart-analysis/chart-analysis.service";
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

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Run AI analysis
    const analysis = await analyzeChart(imageUrl);

    // Create analysis record (PENDING status - will be charged once approved)
    const chartAnalysis = await prisma.chartAnalysis.create({
      data: {
        imageUrl,
        pair: null,
        cost: ANALYSIS_COST,
        status: "PENDING",
        summary: analysis.summary,
        trend: analysis.trend,
        patterns: JSON.stringify(analysis.patterns),
        supportLevels: JSON.stringify(analysis.supportLevels),
        resistanceLevels: JSON.stringify(analysis.resistanceLevels),
        indicators: JSON.stringify(analysis.indicators),
        tradeSetup: JSON.stringify(analysis.tradeSetup),
        riskScore: analysis.riskScore,
        confidence: analysis.confidence,
        userId: user.id,
      },
    });

    // Notify admin via Telegram
    try {
      await notifyAdmin(
        formatChartAnalysisNotification({
          userName: user.name || user.nickname,
          trend: analysis.trend,
          confidence: analysis.confidence,
          cost: ANALYSIS_COST,
        })
      );
    } catch {
      // Don't fail if notification fails
    }

    return NextResponse.json({
      id: chartAnalysis.id,
      analysis,
      cost: ANALYSIS_COST,
      status: "PENDING",
    });
  } catch (error) {
    console.error("Chart analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}

// Admin endpoint to approve and charge for analysis
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin
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
      // Charge user's account
      await prisma.$transaction([
        prisma.chartAnalysis.update({
          where: { id: analysisId },
          data: {
            status: "CHARGED",
            chargedAt: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: analysis.userId },
          data: {
            credits: { decrement: analysis.cost },
          },
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
