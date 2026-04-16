import { Metadata } from "next";
import { requireAdmin } from "@/lib/utils/admin";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard — manage paybacks, exchanges, and chart analysis charges.",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await requireAdmin();
  // Default admin landing is the payback management dashboard
  redirect("/en/dashboard/admin/paybacks");
}
