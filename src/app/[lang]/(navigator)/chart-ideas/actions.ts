"use server";

import { auth } from "@/auth";
import { action } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";

const createChartIdeaSchema = z.object({
  imageUrl: z.string().min(1),
  pair: z.string().min(1),
  direction: z.enum(["LONG", "SHORT"]),
  entryPrice: z.number().positive(),
  stopLoss: z.number().positive(),
  takeProfit: z.number().positive(),
  description: z.string().min(1),
});

export const createChartIdeaAction = action(
  createChartIdeaSchema,
  async (data) => {
    const session = await auth();
    if (!session) {
      throw redirect("/login");
    }

    const {
      user: { email },
    } = session;

    const chartIdea = await prisma.chartIdea.create({
      data: {
        imageUrl: data.imageUrl,
        pair: data.pair,
        direction: data.direction,
        entryPrice: data.entryPrice,
        stopLoss: data.stopLoss,
        takeProfit: data.takeProfit,
        description: data.description,
        user: {
          connect: {
            email,
          },
        },
      },
    });

    return chartIdea;
  }
);

export async function getChartIdeas(page: number = 1) {
  try {
    const pageSize = 12;
    const chartIdeas = await prisma.chartIdea.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            imageUrl: true,
          },
        },
      },
    });
    return chartIdeas;
  } catch (error) {
    console.error("Failed to fetch chart ideas:", error);
    return [];
  }
}

export async function getChartIdeasCount() {
  try {
    return await prisma.chartIdea.count();
  } catch (error) {
    console.error("Failed to fetch chart ideas count:", error);
    return 0;
  }
}
