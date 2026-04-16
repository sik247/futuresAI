import Container from "@/components/ui/container";
import Link from "next/link";
import React from "react";
import { MeHeaderSection } from "./me-header-section";
import { MeMenuSection } from "./me-menu-section";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

async function getPaybackSummary(userId: string) {
  try {
    const accounts = await prisma.exchangeAccount.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        exchange: true,
        trades: {
          where: { withdrawId: null, status: "SUCCESS" },
          select: { payback: true },
        },
      },
    });
    const totalEarned = accounts.reduce((s, a) => s + a.totalCommission, 0);
    const unpaid = accounts.reduce(
      (s, a) => s + a.trades.reduce((ts, t) => ts + t.payback, 0),
      0
    );
    return { count: accounts.length, totalEarned, unpaid };
  } catch {
    return { count: 0, totalEarned: 0, unpaid: 0 };
  }
}

export default async function MePage({
  params,
}: {
  params: { lang: string };
}) {
  const { lang } = params;
  const ko = lang === "ko";
  const session = await auth();
  const payback = session?.user?.id
    ? await getPaybackSummary(session.user.id)
    : null;

  return (
    <div className="bg-muted w-full">
      <Container className="bg-background min-h-screen pb-20 lg:pb-0 px-6 md:px-0 w-full flex flex-col">
        <MeHeaderSection />
        <Separator />

        {/* Payback Summary Card */}
        {payback && payback.count > 0 && (
          <Link
            href={`/${lang}/me/refund-withdraw`}
            className="mx-0 mt-4 block rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition-colors hover:bg-emerald-500/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {ko ? "페이백" : "Payback"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {payback.count} {ko ? "거래소 연결됨" : "exchanges linked"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold font-mono tabular-nums text-emerald-500">
                  ${payback.unpaid.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {ko ? "출금 가능" : "Available"}
                </p>
              </div>
            </div>
          </Link>
        )}

        <MeMenuSection />
      </Container>
    </div>
  );
}
