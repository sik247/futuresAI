import { Metadata } from "next";
import { requireAdmin } from "@/lib/utils/admin";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Founding 200 Members",
  description: "Admin view of the first 200 founding members.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function FoundingMembersPage() {
  await requireAdmin();

  // Fetch all users with contact linking data
  const [foundingMembers, linkedCount, totalLinked] = await Promise.all([
    prisma.user.findMany({
      where: { isFounding100: true },
      orderBy: { inviteNumber: "asc" },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        realEmail: true,
        telegramId: true,
        telegramUsername: true,
        inviteNumber: true,
        isPremium: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where: { isFounding100: true } }),
    prisma.user.count({
      where: {
        AND: [
          { telegramId: { not: null } },
          { OR: [{ realEmail: { not: null } }, { email: { not: { startsWith: "tg_" } } }] },
        ],
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Founding 200 Members</h1>
          <p className="text-sm text-zinc-400 mt-1">
            First 200 users with both Telegram and email linked — receive exclusive research posts and invites.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
              Founding Members
            </p>
            <p className="text-3xl font-bold mt-1">
              {linkedCount}
              <span className="text-lg text-zinc-500">/200</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {200 - linkedCount} slots remaining
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Total Linked
            </p>
            <p className="text-3xl font-bold mt-1">{totalLinked}</p>
            <p className="text-xs text-zinc-500 mt-1">Users with both contacts</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Premium Count
            </p>
            <p className="text-3xl font-bold mt-1">
              {foundingMembers.filter((m) => m.isPremium).length}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Paying founding members</p>
          </div>
        </div>

        {/* Members Table */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-white/[0.03] border-b border-white/[0.08]">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Telegram
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Premium
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {foundingMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                      No founding members yet. The first 200 users to link both Telegram and email will appear here.
                    </td>
                  </tr>
                ) : (
                  foundingMembers.map((m) => {
                    const displayEmail =
                      m.realEmail ||
                      (m.email.startsWith("tg_") && m.email.endsWith("@telegram.user") ? "—" : m.email);
                    return (
                      <tr key={m.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-sm font-mono text-amber-400">
                          #{m.inviteNumber}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="text-white font-medium">{m.name}</div>
                          {m.nickname && (
                            <div className="text-xs text-zinc-500">@{m.nickname}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300">
                          {displayEmail}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="text-zinc-300">
                            {m.telegramUsername ? `@${m.telegramUsername}` : "—"}
                          </div>
                          <div className="text-xs text-zinc-500 font-mono">
                            {m.telegramId || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {m.isPremium ? (
                            <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                              Premium
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-500">Free</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-400">
                          {new Date(m.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export helper */}
        {foundingMembers.length > 0 && (
          <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Quick Export</h3>
            <details>
              <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400">
                Show CSV (click to expand)
              </summary>
              <pre className="mt-3 text-[10px] text-zinc-400 bg-black/40 p-3 rounded-lg overflow-x-auto whitespace-pre">
{`invite_number,name,email,telegram_id,telegram_username,is_premium,joined
${foundingMembers
  .map(
    (m) =>
      `${m.inviteNumber},"${m.name}","${m.realEmail || m.email}","${m.telegramId || ""}","${m.telegramUsername || ""}",${m.isPremium},${new Date(m.createdAt).toISOString()}`
  )
  .join("\n")}`}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
