import { requireAdmin } from "@/lib/utils/admin";
import { blogService } from "@/lib/services/blog/blog.service";
import Container from "@/components/ui/container";
import Link from "next/link";

export default async function AdminBlogPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  await requireAdmin();
  const articles = await blogService.findAll();

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 sm:pt-28 pb-24">
      <Container>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Blog Management</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Create and manage blog articles, guides, and market research
            </p>
          </div>
          <Link
            href={`/${lang}/dashboard/admin/blog/new`}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            + New Article
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-zinc-400">No articles yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
              >
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {article.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        article.published
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {article.published ? "Published" : "Draft"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-white/[0.06] text-zinc-400">
                      {article.category}
                    </span>
                  </div>
                  {article.titleKo && (
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">
                      {article.titleKo}
                    </p>
                  )}
                  <p className="text-xs text-zinc-600 mt-1">
                    {new Date(article.createdAt).toLocaleDateString()} by{" "}
                    {article.author.name}
                  </p>
                </div>
                <Link
                  href={`/${lang}/dashboard/admin/blog/${article.id}`}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs text-zinc-300 transition-colors flex-shrink-0"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
