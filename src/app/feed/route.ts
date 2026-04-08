export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://futuresai.io";

  let articles: {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    category: string;
    publishedAt: Date | null;
    author: { name: string | null; nickname: string | null };
  }[] = [];

  try {
    articles = await prisma.blogArticle.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        category: true,
        publishedAt: true,
        author: { select: { name: true, nickname: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });
  } catch (e) {
    console.error("[feed] Failed to fetch articles:", e);
  }

  const items = articles
    .map((a) => {
      const pubDate = a.publishedAt
        ? new Date(a.publishedAt).toUTCString()
        : new Date().toUTCString();
      const description = a.excerpt || stripHtml(a.content).substring(0, 300);
      const author = a.author.nickname || a.author.name || "Futures AI";

      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${baseUrl}/en/blog/${a.id}</link>
      <guid isPermaLink="true">${baseUrl}/en/blog/${a.id}</guid>
      <description>${escapeXml(description)}</description>
      <author>${escapeXml(author)}</author>
      <category>${escapeXml(a.category)}</category>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Futures AI Blog</title>
    <link>${baseUrl}</link>
    <description>AI-powered crypto trading intelligence, analysis, and educational guides.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=600",
    },
  });
}
