"use client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils/date-fomatting";
import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";
import { Heart, Share2Icon } from "lucide-react";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { HeartIcon } from "@heroicons/react/24/solid";
import { revalidateAll } from "@/lib/services/revalidate";
import { IGetPost } from "@/lib/services/posts/posts.service";
import { createPostLikes, deletePostLikes, follow, unfollow } from "../actions";
import HTMLRenderer from "@/components/html-renderer";

interface TPostDetailSection {
  post: IGetPost;
}

const PostDetailSection = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & TPostDetailSection
>(({ post, ...props }, ref) => {
  const router = useRouter();

  function share() {
    const url = "https://www.cryptoxcorp.com/";
    if (navigator.share) {
      navigator
        .share({
          title: "당신의 트레이딩 메이트, Futures AI",
          text: "Futures AI에서 최고의 트레이딩을 경험해보세요!",
          url: url,
        })
        .then()
        .catch((error) => console.log("Error sharing", error));
    } else {
      // clipboard
      navigator.clipboard.writeText(url);
      alert("링크가 복사되었습니다.");
    }
  }

  return (
    <div
      ref={ref}
      {...props}
      className="flex flex-col gap-12 py-16 w-full  max-md:pb-8"
    >
      <div className="flex flex-col gap-9 max-md:gap-4">
        <p className="text-4xl font-bold">{post.title}</p>
        <div className="flex items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Image
              src={post.user.imageUrl || "/images/profile.png"}
              alt="profile"
              width={24}
              height={24}
              className=" rounded-sm"
            />
            <p className="font-bold">{post.user.nickname}</p>
            <Button
              className="text-xs font-bold "
              variant={"outline"}
              onClick={async () => {
                if (post.isFollowing) {
                  await unfollow(post.user.id);
                  revalidateAll(`/posts/${post.id}`);
                } else {
                  await follow(post.user.id);
                  revalidateAll(`/posts/${post.id}`);
                }
              }}
            >
              {post.isFollowing ? "언팔로우" : "팔로우"}
            </Button>
          </div>
          <div className="flex gap-5 items-center">
            <p className="text-sm font-medium text-muted-foreground">
              {formatDate(post.createdAt)}
            </p>
            <Button
              className="text-xs font-bold bg-white"
              variant={"outline"}
              onClick={() => {
                router.push(`/posts/${post.id}/update`);
              }}
            >
              수정
            </Button>
          </div>
        </div>
      </div>
      <div className="relative w-full h-[660px] ">
        <Image
          src={post.imageUrl}
          alt={post.title}
          fill={true}
          className="rounded-3xl object-contain"
        />
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex w-full items-center justify-between">
          <Button
            className="text-xs font-bold  flex items-center gap-1 rounded-full bg-white"
            variant={"outline"}
            onClick={async () => {
              if (post.isLiked) {
                await deletePostLikes(post.id);
                revalidateAll(`/posts`);
              } else {
                await createPostLikes(post.id);
                revalidateAll(`/posts`);
              }
            }}
          >
            {post.isLiked ? (
              <HeartIcon className="h-6 w-6 text-red-500" />
            ) : (
              <Heart className="h-6 w-6 " />
            )}
            <p className="text-base font-normal">{post.likes.length}</p>
          </Button>
          <div className="flex items-center gap-7">
            <div className="text-xs font-bold bg-white flex gap-1 items-center ">
              <ChatBubbleBottomCenterTextIcon className="h-6 w-6" />
              <span className="text-base font-normal">
                {post.comments.length}
              </span>
            </div>
            <div className="text-xs font-bold bg-white ">
              <Button
                className="bg-transparent"
                onClick={async (e) => {
                  e.preventDefault();
                  share();
                }}
              >
                <Share2Icon className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
        {post.content && <HTMLRenderer html={post.content} renderMode="text" />}
        <Separator orientation="horizontal" />
      </div>
    </div>
  );
});

PostDetailSection.displayName = "PostDetailSection";
export { PostDetailSection };
