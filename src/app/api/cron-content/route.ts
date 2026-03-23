export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  runContentPipeline,
  getContentFeed,
  publishContent,
} from "@/lib/services/social/content-bot.service";

// GET /api/cron-content - Vercel Cron endpoint
// Runs the full content pipeline: aggregate -> translate -> publish
export async function GET(request: Request) {
  // Validate cron secret in production
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startTime = Date.now();

  try {
    console.log("[cron-content] Starting content pipeline...");

    // Run the full pipeline (aggregate + translate)
    const pipelineStats = await runContentPipeline();

    // Auto-publish all translated items
    const translatedItems = getContentFeed({ status: "translated" });
    let published = 0;
    for (const item of translatedItems) {
      if (publishContent(item.id)) published++;
    }

    const stats = {
      newItems: pipelineStats.newItems,
      translated: pipelineStats.translated,
      published,
      total: pipelineStats.total,
    };

    // Persist results to database
    try {
      await prisma.contentBotLog.create({
        data: {
          action: "aggregate",
          details: `Cron pipeline: ${stats.newItems} new, ${stats.translated} translated, ${stats.published} published (${Date.now() - startTime}ms)`,
          itemCount: stats.newItems + stats.translated + stats.published,
        },
      });
    } catch {
      console.log("[cron-content] DB logging skipped");
    }

    const result = {
      success: true,
      stats,
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
    };

    console.log("[cron-content] Pipeline complete:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron-content] Pipeline failed:", error);

    // Log the error
    try {
      await prisma.contentBotLog.create({
        data: {
          action: "error",
          details: `Cron pipeline error: ${error instanceof Error ? error.message : "Unknown error"} (${Date.now() - startTime}ms)`,
          itemCount: 0,
        },
      });
    } catch {
      // DB unavailable, just log to console
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Pipeline failed",
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
