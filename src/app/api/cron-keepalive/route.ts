export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";

// Vercel Cron: prevents Supabase free-tier auto-pause by touching the project
// every few days. Hits both storage (project-scoped) and Postgres (DB-scoped).

export async function GET() {
  const results: Record<string, unknown> = { ts: new Date().toISOString() };

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase.storage.from("CryptoX").list("", { limit: 1 });
    results.supabaseStorage = error ? { ok: false, error: error.message } : { ok: true, items: data?.length ?? 0 };
  } catch (e) {
    results.supabaseStorage = { ok: false, error: (e as Error).message };
  }

  try {
    const rows = await prisma.$queryRaw<{ ping: number }[]>`SELECT 1 as ping`;
    results.db = { ok: true, rows: rows.length };
  } catch (e) {
    results.db = { ok: false, error: (e as Error).message };
  }

  return NextResponse.json(results);
}
