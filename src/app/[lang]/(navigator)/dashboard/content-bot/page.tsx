import { Metadata } from "next";
import { requireAdmin } from "@/lib/utils/admin";
import ContentBotClient from "./content-bot-client";

export const metadata: Metadata = {
  title: "Content Bot Manager",
  description:
    "Admin dashboard for managing automated content aggregation, translation, and publishing pipeline.",
  robots: { index: false, follow: false },
};

export default async function ContentBotPage() {
  await requireAdmin();
  return <ContentBotClient />;
}
