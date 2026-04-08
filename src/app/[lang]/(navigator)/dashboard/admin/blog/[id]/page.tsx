import { requireAdmin } from "@/lib/utils/admin";
import { blogService } from "@/lib/services/blog/blog.service";
import { notFound } from "next/navigation";
import Container from "@/components/ui/container";
import { BlogForm } from "../blog-form";

export default async function AdminBlogEditPage({
  params: { id },
}: {
  params: { lang: string; id: string };
}) {
  await requireAdmin();
  const article = await blogService.findOne(id);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 sm:pt-28 pb-24">
      <Container className="max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-8">Edit Article</h1>
        <BlogForm
          article={{
            id: article.id,
            title: article.title,
            titleKo: article.titleKo,
            content: article.content,
            contentKo: article.contentKo,
            excerpt: article.excerpt,
            excerptKo: article.excerptKo,
            imageUrl: article.imageUrl,
            category: article.category,
            tags: article.tags,
            published: article.published,
          }}
        />
      </Container>
    </div>
  );
}
