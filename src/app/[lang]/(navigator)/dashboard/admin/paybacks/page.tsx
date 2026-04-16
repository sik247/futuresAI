import { Metadata } from "next";
import { requireAdmin } from "@/lib/utils/admin";
import PaybacksDashboard from "./paybacks-dashboard";

export const metadata: Metadata = {
  title: "Payback Management",
  description: "View and manage user paybacks across all exchanges.",
  robots: { index: false, follow: false },
};

export default async function PaybacksPage() {
  await requireAdmin();
  return <PaybacksDashboard />;
}
