import { NextRequest, NextResponse } from "next/server";
import { blogService } from "@/lib/services/blog/blog.service";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const article = await blogService.findOne(params.id);
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(article);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const article = await blogService.update(params.id, {
    title: body.title,
    titleKo: body.titleKo,
    content: body.content,
    contentKo: body.contentKo,
    excerpt: body.excerpt,
    excerptKo: body.excerptKo,
    imageUrl: body.imageUrl,
    category: body.category,
    tags: body.tags,
    published: body.published,
    publishedAt: body.published ? new Date() : null,
  });

  return NextResponse.json(article);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await blogService.delete(params.id);
  return NextResponse.json({ success: true });
}
