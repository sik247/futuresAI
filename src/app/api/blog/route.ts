import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/services/blog/blog.service";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const category = searchParams.get("category") || undefined;

  const [articles, total] = await Promise.all([
    blogService.findPublished(page, category),
    blogService.getPublishedCount(category),
  ]);

  return NextResponse.json({ articles, total });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const article = await blogService.create({
    title: body.title,
    titleKo: body.titleKo || "",
    content: body.content,
    contentKo: body.contentKo || "",
    excerpt: body.excerpt || "",
    excerptKo: body.excerptKo || "",
    imageUrl: body.imageUrl || "",
    category: body.category || "general",
    tags: body.tags || [],
    published: body.published ?? false,
    publishedAt: body.published ? new Date() : null,
    author: { connect: { email: session.user.email } },
  });

  return NextResponse.json(article);
}
