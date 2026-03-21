import Container from "@/components/ui/container";

import PostUpdateForm from "./update-form";
import { getPostById } from "./actions";

export default async function PostUpdate({
  params: { id },
}: {
  params: { id: string };
}) {
  const [post] = await Promise.all([getPostById(id)]);

  if (!post) {
    return;
  }

  return (
    <Container className="flex flex-col gap-16 pb-16 max-md:px-4">
      <PostUpdateForm id={id} post={post} />
    </Container>
  );
}
