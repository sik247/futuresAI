import { requireAdmin } from "@/lib/utils/admin";
import Container from "@/components/ui/container";
import { BlogForm } from "../blog-form";

export default async function AdminBlogNewPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 sm:pt-28 pb-24">
      <Container className="max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-8">New Blog Article</h1>
        <BlogForm />
      </Container>
    </div>
  );
}
