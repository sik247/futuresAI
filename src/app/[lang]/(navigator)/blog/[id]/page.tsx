import Container from "@/components/ui/container";
import { blogService } from "@/lib/services/blog/blog.service";
import { notFound } from "next/navigation";
import { Metadata } from "next";

type PageProps = {
  params: { lang: string; id: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await blogService.findOne(params.id);
  if (!article || !article.published) return {};

  const isKo = params.lang === "ko";
  const title = isKo && article.titleKo ? article.titleKo : article.title;
  const description = isKo && article.excerptKo ? article.excerptKo : article.excerpt;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://futuresai.io";

  return {
    title,
    description: description || `${title} - Futures AI Blog`,
    openGraph: {
      title,
      description: description || `${title} - Futures AI Blog`,
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      authors: [article.author.nickname || article.author.name || "Futures AI"],
      images: article.imageUrl ? [article.imageUrl] : [],
      url: `${baseUrl}/${params.lang}/blog/${params.id}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description || `${title} - Futures AI Blog`,
    },
    alternates: {
      canonical: `${baseUrl}/${params.lang}/blog/${params.id}`,
      languages: {
        en: `${baseUrl}/en/blog/${params.id}`,
        ko: `${baseUrl}/ko/blog/${params.id}`,
      },
    },
  };
}

export default async function BlogArticlePage({ params: { lang, id } }: PageProps) {
  const article = await blogService.findOne(id);

  if (!article || !article.published) {
    notFound();
  }

  const isKo = lang === "ko";
  const title = isKo && article.titleKo ? article.titleKo : article.title;
  const content = isKo && article.contentKo ? article.contentKo : article.content;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://futuresai.io";

  // Article structured data for Google / AdSense
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: isKo && article.excerptKo ? article.excerptKo : article.excerpt,
    image: article.imageUrl || `${baseUrl}/opengraph-image.png`,
    author: {
      "@type": "Person",
      name: article.author.nickname || article.author.name || "Futures AI",
    },
    publisher: {
      "@type": "Organization",
      name: "Futures AI",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt?.toISOString(),
    mainEntityOfPage: `${baseUrl}/${lang}/blog/${id}`,
    keywords: article.tags.join(", "),
    inLanguage: isKo ? "ko" : "en",
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 sm:pt-28 pb-24">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container className="max-w-3xl">
        {/* Category & date */}
        <div className="flex items-center gap-3 mb-6">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 uppercase">
            {article.category}
          </span>
          {article.publishedAt && (
            <time
              dateTime={article.publishedAt.toISOString()}
              className="text-xs text-zinc-500 font-mono"
            >
              {new Date(article.publishedAt).toLocaleDateString(isKo ? "ko-KR" : "en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-6">
          {title}
        </h1>

        {/* Author */}
        <div className="flex items-center gap-3 mb-8 pb-8 border-b border-white/[0.06]">
          {article.author.imageUrl && (
            <img
              src={article.author.imageUrl}
              alt=""
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <p className="text-sm font-medium text-zinc-200">
              {article.author.nickname || article.author.name}
            </p>
            <p className="text-xs text-zinc-500">FuturesAI Team</p>
          </div>
        </div>

        {/* Hero image */}
        {article.imageUrl && (
          <div className="relative rounded-xl overflow-hidden mb-10">
            <img
              src={article.imageUrl}
              alt={title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Content */}
        <article
          className="prose prose-invert prose-zinc max-w-none
            prose-headings:text-zinc-100 prose-headings:font-bold
            prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-base
            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-zinc-100
            prose-code:text-blue-300 prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-img:rounded-xl
            prose-li:text-zinc-300 prose-li:text-base
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-white/[0.06]">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-mono rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.06]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="mt-10">
          <a
            href={`/${lang}/sns`}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            &larr; {isKo ? "소셜 허브로 돌아가기" : "Back to Social Hub"}
          </a>
        </div>
      </Container>
    </div>
  );
}
