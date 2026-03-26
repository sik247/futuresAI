export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { notifyAdmin } from "@/lib/services/notifications/telegram.service";

export async function GET() {
  try {
    // User stats
    const totalUsers = await prisma.user.count();
    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    // Chart analysis stats
    const totalAnalyses = await prisma.chartAnalysis.count();
    const analysesToday = await prisma.chartAnalysis.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    // Portfolio stats
    const totalPortfolios = await prisma.portfolio.count();
    const totalHoldings = await prisma.holding.count();

    // Content stats
    const totalContent = await prisma.managedContent.count({
      where: { status: { in: ["published", "translated"] } },
    });

    const now = new Date().toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    let msg = `<b>데일리 어드민 리포트</b>\n<i>${now}</i>\n\n`;

    msg += `<b>유저</b>\n`;
    msg += `총 가입자: ${totalUsers}명\n`;
    msg += `오늘 신규: +${newUsersToday}명\n\n`;

    msg += `<b>AI 차트 분석</b>\n`;
    msg += `총 분석: ${totalAnalyses}건\n`;
    msg += `오늘: ${analysesToday}건\n\n`;

    msg += `<b>포트폴리오</b>\n`;
    msg += `활성 포트폴리오: ${totalPortfolios}개\n`;
    msg += `총 보유 종목: ${totalHoldings}개\n\n`;

    msg += `<b>콘텐츠</b>\n`;
    msg += `게시된 콘텐츠: ${totalContent}개\n\n`;

    msg += `<i>— FuturesAI</i>`;

    const sent = await notifyAdmin(msg);

    return NextResponse.json({
      success: true,
      sent,
      summary: { totalUsers, newUsersToday, analysesToday, totalPortfolios },
    });
  } catch (error) {
    console.error("Daily summary cron error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
