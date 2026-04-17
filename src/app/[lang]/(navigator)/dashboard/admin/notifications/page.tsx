import { Metadata } from "next";
import { requireAdmin } from "@/lib/utils/admin";
import NotificationsAdmin from "./notifications-admin";

export const metadata: Metadata = {
  title: "Notification Management",
  description: "Send and manage user notifications.",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  await requireAdmin();
  return <NotificationsAdmin />;
}
