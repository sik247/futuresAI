import Container from "@/components/ui/container";
import { getPostById } from "./actions";
import { PostDetailSection } from "./post-detail-section";
import { CommentForm } from "./comment-form";
import { CommentListSection } from "./comment-list-section";

export default async function PostDetail({
  params: { id },
}: {
  params: { id: string };
}) {
  const [post] = await Promise.all([getPostById(id)]);

  if (!post) {
    return;
  }

  return (
    <Container className="flex flex-col  pb-16 max-md:px-4">
      <PostDetailSection post={post} />
      <CommentForm postId={id} commentLength={post.comments.length} />
      <CommentListSection comments={post.comments} />
    </Container>
  );
}
