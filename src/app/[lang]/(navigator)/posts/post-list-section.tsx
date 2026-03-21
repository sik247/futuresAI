"use client";
import PagiNation from "@/components/pagenation";
import { getAnimationProps } from "@/lib/utils/get-animation-props";
import { Prisma } from "@prisma/client";
import React, { useCallback, useMemo } from "react";
import PostCard from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IGetPosts } from "@/lib/services/posts/posts.service";
import {
  createPostLikes,
  deletePostLikes,
  follow,
  getPosts,
  unfollow,
} from "./actions";
import { revalidateAll } from "@/lib/services/revalidate";
import { CategorySelectSection } from "./category-select-section";
import { useLoading } from "@/components/ui/use-loading";

interface IPostListSection {
  posts: IGetPosts[];
  postCount: number;
  category?: string;
}

const PostListSection = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"section"> & IPostListSection
>(({ posts: initialPosts, postCount, category, ...props }, ref) => {
  const router = useRouter();
  const [posts, setPosts] = React.useState<IGetPosts[]>(initialPosts);
  const [currentPage, setCurrentPage] = React.useState(1);
  const { trigger, stop } = useLoading();

  const fetchMore = useCallback(async () => {
    trigger();
    const nextPage = currentPage + 1;
    const nextPosts = await getPosts(nextPage, category);
    setCurrentPage(nextPage);
    setPosts([...posts, ...nextPosts]);
    stop();
  }, [currentPage, posts]);

  const allFetched = useMemo(
    () => posts.length >= postCount,
    [posts, postCount]
  );

  return (
    <section
      ref={ref}
      {...props}
      className="flex flex-col gap-16 py-16 w-full max-md:gap-8"
    >
      <div className="flex flex-col gap-8">
        <div className="flex justify-between ">
          <div
            className="flex flex-col gap-4 max-md:gap-2"
            {...getAnimationProps("up", 500, 0)}
          >
            <p className="text-4xl max-md:text-2xl text-foreground font-extrabold">
              커뮤니티
            </p>
            <p className="text-xl max-md:text-sm font-semibold text-muted-foreground">
              트레이더들을 위한 귀한 정보들
            </p>
          </div>
          <Button
            className="flex items-center gap-2 bg-white"
            variant={"outline"}
            onClick={() => router.push("/posts/new")}
            {...getAnimationProps("up", 500, 0)}
          >
            <p className="text-sm">글쓰기</p>
          </Button>
        </div>
        <CategorySelectSection selectedCategory={category} />
      </div>

      <div className="md:grid md:grid-cols-3 w-full gap-6 no-scrollbar flex flex-col ">
        {posts.map((post, index) => (
          <PostCard
            id={post.id}
            key={index}
            index={index}
            title={post.title}
            content={post.content}
            imageUrl={post.imageUrl}
            profileImageUrl={post.user.imageUrl || "/images/profile.png"}
            profileName={post.user.nickname}
            userId={post.user.id}
            createdAt={post.createdAt}
            commentCount={post.comments.length}
            likeCount={post.likes.length}
            isFollowing={post.isFollowing}
            isLiked={post.isLiked}
            onFollow={async () => {
              if (post.isFollowing) {
                await unfollow(post.user.id);
                revalidateAll(`/posts`);
              } else {
                await follow(post.user.id);
                revalidateAll(`/posts`);
              }
            }}
            onLike={async () => {
              if (post.isLiked) {
                await deletePostLikes(post.id);
                revalidateAll(`/posts`);
              } else {
                await createPostLikes(post.id);
                revalidateAll(`/posts`);
              }
            }}
            isLong={post.isLong}
          />
        ))}
      </div>
      <Button
        className="w-full"
        variant={"outline"}
        onClick={fetchMore}
        disabled={allFetched}
      >
        더보기
      </Button>
    </section>
  );
});

PostListSection.displayName = "PostListSection";
export { PostListSection };
