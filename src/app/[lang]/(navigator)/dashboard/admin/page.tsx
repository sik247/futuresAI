import { Metadata } from "next";
import { requireAdmin } from "@/lib/utils/admin";
import AdminDashboard from "../admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard — manage paybacks, exchanges, and chart analysis charges.",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await requireAdmin();
  return <AdminDashboard />;
}
