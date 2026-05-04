/**
 * Supabase Storage uploader for chart PNGs. Uses the service-role key so it can
 * write into the public `chart-research` bucket from CI without RLS policies.
 *
 * Returns the public CDN URL so the BlogArticle.imageUrl and article-body
 * <img> tags can reference Supabase directly — no Vercel deploy required for
 * images to render publicly.
 */
import fs from "fs/promises";
import path from "path";

const BUCKET = "chart-research";

function getSupabaseUrl(): string {
  // Dedicated Supabase project for chart hosting — separate from the main
  // app's Supabase so writes here don't touch the production project.
  const u = process.env.CHART_RESEARCH_SUPABASE_URL;
  if (!u) throw new Error("CHART_RESEARCH_SUPABASE_URL not set");
  return u.replace(/\/+$/, "");
}

function getServiceKey(): string {
  const k = process.env.CHART_RESEARCH_SUPABASE_KEY;
  if (!k) throw new Error("CHART_RESEARCH_SUPABASE_KEY not set");
  return k;
}

export function publicUrlFor(objectPath: string): string {
  return `${getSupabaseUrl()}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

/**
 * Upload a local PNG file to Supabase Storage. The object path inside the
 * bucket is `chart-research/<filename>`. Uses upsert so re-runs replace the
 * previous capture for the same date+pair+interval.
 */
export async function uploadPng(localPath: string, objectName?: string): Promise<string> {
  const buf = await fs.readFile(localPath);
  const name = objectName ?? path.basename(localPath);
  const url = `${getSupabaseUrl()}/storage/v1/object/${BUCKET}/${name}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getServiceKey()}`,
      apikey: getServiceKey(),
      "Content-Type": "image/png",
      "x-upsert": "true",
      "Cache-Control": "public, max-age=31536000",
    },
    body: buf,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`supabase upload failed (${res.status}): ${txt}`);
  }
  return publicUrlFor(name);
}
