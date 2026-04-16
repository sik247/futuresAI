import { Metadata } from "next";
import { requireAdmin } from "@/lib/utils/admin";
import AdminDashboard from "../../admin-dashboard";

export const metadata: Metadata = {
  title: "Admin — Manage",
  description: "Manage withdrawals, approvals, chart analyses, and exchange accounts.",
  robots: { index: false, follow: false },
};

export default async function ManagePage() {
  await requireAdmin();
  return <AdminDashboard />;
}
