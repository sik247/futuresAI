import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ChatClient from "./chat-client";

export const metadata: Metadata = {
  title: "AI Quant Chat - FuturesAI",
  description: "Professional AI trading assistant with real-time market data",
};

export default async function ChatPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const session = await auth();
  if (!session?.user?.email) redirect(`/${lang}/login`);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect(`/${lang}/login`);

  const walletAddress = process.env.PAYMENT_WALLET_TRC20 || process.env.PAYMENT_WALLET_ADDRESS || "";

  return (
    <ChatClient lang={lang} userName={user.name} walletAddress={walletAddress} />
  );
}
