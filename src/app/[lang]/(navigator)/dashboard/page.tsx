import { Metadata } from "next";
import { requireAdmin } from "@/lib/utils/admin";
import AdminDashboard from "./admin-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Futures AI admin dashboard. Manage users, monitor trading activity, and review payback requests.",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  await requireAdmin();
  return <AdminDashboard />;
}
