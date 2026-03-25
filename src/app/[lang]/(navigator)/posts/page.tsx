import Container from "@/components/ui/container";
import { PostListSection } from "./post-list-section";
import { getPostCount, getPosts } from "./actions";

type TPostList = {
  category: string;
};

export default async function PostList({
  searchParams,
}: {
  searchParams: TPostList;
}) {
  const { category } = searchParams;
  const [posts, postCount] = await Promise.all([
    getPosts(1, category),
    getPostCount(category),
  ]);
  return (
    <div className="bg-zinc-950 min-h-screen">
    <Container className="flex flex-col gap-16 pb-16 max-md:px-4">
      <PostListSection
        posts={posts}
        postCount={postCount}
        category={category}
      />
    </Container>
    </div>
  );
}
