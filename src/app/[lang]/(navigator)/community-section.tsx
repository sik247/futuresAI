"use client";
import PostCard from "@/components/post-card";
import Container from "@/components/ui/container";
import { IGetPosts } from "@/lib/services/posts/posts.service";
import React from "react";
import {
  createPostLikes,
  deletePostLikes,
  follow,
  unfollow,
} from "./posts/actions";
import { revalidateAll } from "@/lib/services/revalidate";

type TCommunitySection = {
  posts: IGetPosts[];
};

const CommunitySection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TCommunitySection
>(({ posts, ...props }, ref) => {
  return (
    <section ref={ref} className="w-screen flex flex-col gap-6">
      <Container>
        <div className="flex flex-col gap-2 w-full items-center">
          <h2 className="text-2xl font-serif font-bold text-foreground">Community</h2>
          <p className="text-sm font-medium text-muted-foreground">
            Premium trading insights in one place
          </p>
        </div>
      </Container>

      {/* Scrolling row 1: left to right */}
      <div className="overflow-hidden whitespace-nowrap w-full">
        <div className="inline-flex hover:animate-none group py-2 h-full">
          {posts.map((post, index) => (
            <div
              key={`r1-${index}`}
              className="animate-infinite-scroll3 group-hover:pause mx-2"
            >
              <PostCard
                index={index}
                {...post}
                profileImageUrl={post.user.imageUrl || "/images/profile.png"}
                profileName={post.user.nickname}
                commentCount={post.comments.length}
                likeCount={post.likes.length}
                onFollow={async () => {
                  if (post.isFollowing) {
                    await unfollow(post.user.id);
                    revalidateAll(`/`);
                  } else {
                    await follow(post.user.id);
                    revalidateAll(`/`);
                  }
                }}
                onLike={async () => {
                  if (post.isLiked) {
                    await deletePostLikes(post.id);
                    revalidateAll(`/`);
                  } else {
                    await createPostLikes(post.id);
                    revalidateAll(`/`);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Scrolling row 2: right to left */}
      <div className="overflow-hidden whitespace-nowrap w-full">
        <div className="hover:animate-none group inline-flex">
          {posts.map((post, index) => (
            <div
              key={`r2-${index}`}
              className="animate-infinite-scroll-right group-hover:pause mx-2"
            >
              <PostCard
                index={index}
                {...post}
                profileImageUrl={post.user.imageUrl || "/images/profile.png"}
                profileName={post.user.nickname}
                commentCount={post.comments.length}
                likeCount={post.likes.length}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

CommunitySection.displayName = "CommunitySection";

export { CommunitySection };
