import { Metadata } from "next";
import { requireAdmin } from "@/lib/utils/admin";
import ResearchGenerator from "./research-generator";

export const metadata: Metadata = {
  title: "Generate Research",
  description: "Generate deep research blog posts with AI analysis.",
  robots: { index: false, follow: false },
};

export default async function ResearchPage() {
  await requireAdmin();
  return <ResearchGenerator />;
}
