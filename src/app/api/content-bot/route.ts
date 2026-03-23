export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  aggregateAllContent,
  translatePendingContent,
  publishContent,
  runContentPipeline,
  getContentFeed,
  isStoreEmpty,
  type ManagedContent,
} from "@/lib/services/social/content-bot.service";

// GET /api/content-bot - Get content feed
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "all";
    const status = searchParams.get("status") || "all";
    const lang = searchParams.get("lang") || "en";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);

    // Try database first
    try {
      const where: Record<string, unknown> = {};
      if (type !== "all") where.type = type;
      if (status !== "all") where.status = status;

      const [items, total] = await Promise.all([
        prisma.managedContent.findMany({
          where,
          orderBy: { publishedAt: "desc" },
          take: limit,
          skip: (page - 1) * limit,
        }),
        prisma.managedContent.count({ where }),
      ]);

      // If Korean lang requested, swap title/description to Korean versions
      const mappedItems = items.map((item) => ({
        ...item,
        title: lang === "ko" && item.titleKo ? item.titleKo : item.title,
        description:
          lang === "ko" && item.descriptionKo
            ? item.descriptionKo
            : item.description,
      }));

      return NextResponse.json({ items: mappedItems, total, page });
    } catch {
      // Database unavailable, fall back to in-memory store
      console.log("[content-bot] DB unavailable, using in-memory store");
    }

    // Fallback to in-memory store
    // Auto-populate if store is empty (serverless cold start / dev hot reload)
    if (isStoreEmpty()) {
      console.log("[content-bot] Store empty, auto-aggregating...");
      await runContentPipeline();
    }

    const feedItems = getContentFeed({
      type: type !== "all" ? type as ManagedContent["type"] : undefined,
      status: status !== "all" ? status as ManagedContent["status"] : undefined,
      limit,
      lang: lang as "en" | "ko",
    });

    return NextResponse.json({
      items: feedItems,
      total: feedItems.length,
      page,
    });
  } catch (error) {
    console.error("[content-bot] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content feed" },
      { status: 500 }
    );
  }
}

// POST /api/content-bot - Trigger pipeline actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    if (!action) {
      return NextResponse.json(
        { error: "Missing required field: action" },
        { status: 400 }
      );
    }

    const validActions = ["aggregate", "translate", "publish", "run-pipeline"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        {
          error: `Invalid action. Must be one of: ${validActions.join(", ")}`,
        },
        { status: 400 }
      );
    }

    let stats: { newItems: number; translated: number; published: number } = {
      newItems: 0,
      translated: 0,
      published: 0,
    };

    switch (action) {
      case "aggregate": {
        const newCount = await aggregateAllContent();
        stats.newItems = newCount;

        // Persist new items to DB if available
        const allItems = getContentFeed({ status: "pending" });
        await persistNewItems(allItems);
        await logAction("aggregate", `Aggregated ${newCount} new items`, newCount);
        break;
      }

      case "translate": {
        const translated = await translatePendingContent();
        stats.translated = translated;

        // Sync translations to DB if available
        await syncTranslationsToDb();
        await logAction("translate", `Translated ${translated} items`, translated);
        break;
      }

      case "publish": {
        // Publish all translated items
        const translatedItems = getContentFeed({ status: "translated" });
        let publishedCount = 0;
        for (const item of translatedItems) {
          if (publishContent(item.id)) publishedCount++;
        }
        stats.published = publishedCount;

        // Sync published status to DB if available
        await syncStatusToDb("published");
        await logAction("publish", `Published ${publishedCount} items`, publishedCount);
        break;
      }

      case "run-pipeline": {
        const pipelineStats = await runContentPipeline();
        stats = { ...pipelineStats, published: 0 };

        // Persist everything to DB
        await syncAllToDb();
        await logAction(
          "aggregate",
          `Pipeline: ${pipelineStats.newItems} new, ${pipelineStats.translated} translated, ${pipelineStats.total} total`,
          pipelineStats.newItems + pipelineStats.translated
        );
        break;
      }
    }

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("[content-bot] POST error:", error);

    await logAction(
      "error",
      `Pipeline error: ${error instanceof Error ? error.message : "Unknown error"}`,
      0
    );

    return NextResponse.json(
      { error: "Failed to execute pipeline action" },
      { status: 500 }
    );
  }
}

// ── DB persistence helpers ──────────────────────────────────────────

async function persistNewItems(
  items: Array<{
    type: string;
    sourceUrl: string;
    title: string;
    titleKo: string;
    description: string;
    descriptionKo: string;
    thumbnailUrl?: string;
    sourceName: string;
    sourceCategory: string;
    publishedAt: Date;
    fetchedAt: Date;
    status: string;
    metadata: Record<string, unknown>;
  }>
) {
  try {
    for (const item of items) {
      await prisma.managedContent.upsert({
        where: { sourceUrl: item.sourceUrl },
        create: {
          type: item.type,
          sourceUrl: item.sourceUrl,
          title: item.title,
          titleKo: item.titleKo,
          description: item.description,
          descriptionKo: item.descriptionKo,
          thumbnailUrl: item.thumbnailUrl ?? null,
          sourceName: item.sourceName,
          sourceCategory: item.sourceCategory,
          publishedAt: item.publishedAt,
          fetchedAt: item.fetchedAt,
          status: item.status,
          metadata: item.metadata as object,
        },
        update: {}, // Don't update existing items
      });
    }
  } catch (err) {
    console.log("[content-bot] DB persist skipped:", err instanceof Error ? err.message : "unavailable");
  }
}

async function syncTranslationsToDb() {
  try {
    const items = getContentFeed({ status: "translated" });
    for (const item of items) {
      await prisma.managedContent.updateMany({
        where: { sourceUrl: item.sourceUrl },
        data: {
          titleKo: item.titleKo,
          descriptionKo: item.descriptionKo,
          status: "translated",
        },
      });
    }
  } catch {
    console.log("[content-bot] DB translation sync skipped");
  }
}

async function syncStatusToDb(status: string) {
  try {
    const items = getContentFeed({ status: status as ManagedContent["status"] });
    for (const item of items) {
      await prisma.managedContent.updateMany({
        where: { sourceUrl: item.sourceUrl },
        data: { status },
      });
    }
  } catch {
    console.log("[content-bot] DB status sync skipped");
  }
}

async function syncAllToDb() {
  try {
    const items = getContentFeed({});
    for (const item of items) {
      await prisma.managedContent.upsert({
        where: { sourceUrl: item.sourceUrl },
        create: {
          type: item.type,
          sourceUrl: item.sourceUrl,
          title: item.title,
          titleKo: item.titleKo,
          description: item.description,
          descriptionKo: item.descriptionKo,
          thumbnailUrl: item.thumbnailUrl ?? null,
          sourceName: item.sourceName,
          sourceCategory: item.sourceCategory,
          publishedAt: item.publishedAt,
          fetchedAt: item.fetchedAt,
          status: item.status,
          metadata: item.metadata as object,
        },
        update: {
          titleKo: item.titleKo,
          descriptionKo: item.descriptionKo,
          status: item.status,
        },
      });
    }
  } catch {
    console.log("[content-bot] DB full sync skipped");
  }
}

async function logAction(action: string, details: string, itemCount: number) {
  try {
    await prisma.contentBotLog.create({
      data: { action, details, itemCount },
    });
  } catch {
    console.log(`[content-bot] Log (${action}): ${details}`);
  }
}
