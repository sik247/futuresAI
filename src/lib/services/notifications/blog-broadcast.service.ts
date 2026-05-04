import { sendBlogToChannel } from "./telegram.service";
import { wasSent, markSent, hashContent } from "./dedup-store";

const SITE_URL = "https://futuresai.io";

export type BlogArticleLite = {
  id: string;
  title: string;
  titleKo: string;
  excerpt: string;
  excerptKo: string;
  imageUrl: string;
  /** Optional raw PNG bytes — uploaded as multipart when set, used to broadcast
   *  before the image is deployed to a public URL (e.g. /public/images/blog). */
  imageBuffer?: Uint8Array;
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] || c,
  );
}

function buildKoCaption(article: BlogArticleLite): string {
  const title = article.titleKo || article.title;
  const excerpt = article.excerptKo || article.excerpt;
  const url = `${SITE_URL}/ko/blog/${article.id}`;

  return [
    `<b>${escapeHtml(title)}</b>`,
    "",
    escapeHtml(excerpt),
    "",
    `📖 <a href="${url}">전체 글 보기</a>`,
    `<i>— FuturesAI드림</i>`,
  ].join("\n");
}

/**
 * Broadcast a published blog article to the Korean Telegram channel via the
 * main news bot. Uses dedup-store to ensure each article fires at most once.
 * Returns true on send success, false on no-op or failure.
 */
export async function broadcastBlogArticle(
  article: BlogArticleLite,
): Promise<{ ko: boolean }> {
  const kind = "blog-broadcast-ko";
  const hash = hashContent("blog", article.id);
  if (await wasSent(kind, hash, 30)) return { ko: false };

  const caption = buildKoCaption(article);
  const photoUrl = article.imageUrl?.startsWith("http") ? article.imageUrl : undefined;
  const ok = await sendBlogToChannel("ko", {
    photoUrl,
    photoBuffer: article.imageBuffer,
    photoFilename: `${article.id}.png`,
    text: caption,
  });
  if (ok) await markSent(kind, hash);
  return { ko: ok };
}
