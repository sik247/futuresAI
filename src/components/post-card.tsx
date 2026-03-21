"use client";

import { getAnimationProps } from "@/lib/utils/get-animation-props";
import Image from "next/image";
import React from "react";
import { Button } from "./ui/button";
import { Heart, Share2Icon, X } from "lucide-react";
import { ArrowLongDownIcon, ArrowLongUpIcon, ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { formatDate } from "@/lib/utils/date-fomatting";
import { HeartIcon } from "@heroicons/react/24/solid";

export type TPostCard = {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  profileImageUrl: string;
  profileName: string;
  userId: string;
  createdAt: Date;
  commentCount: number;
  likeCount: number;
  index: number;
  isFollowing: boolean;
  isLiked: boolean;
  onFollow?: () => void;
  onLike?: () => void;
  isEditMode?: boolean;
  onDelete?: () => void;
  isLong?: boolean;
};

const PostCard: React.FC<TPostCard> = ({
  id,
  index,
  title,
  content,
  imageUrl,
  profileImageUrl,
  profileName,
  userId,
  createdAt,
  commentCount,
  likeCount,
  isFollowing,
  isLiked,
  onFollow,
  onLike,
  isEditMode,
  onDelete,
  isLong,
}) => {
  let innerHtml = content;
  innerHtml = innerHtml?.replace(/<img[^>]*>/g, "[이미지]");
  innerHtml = innerHtml?.replace(/(<([^>]+)>)/gi, " ");
  function share() {
    const url = "https://www.cryptoxcorp.com/";
    if (navigator.share) {
      navigator
        .share({
          title: "당신의 트레이딩 메이트, 크립토엑스",
          text: "크립토엑스에서 최고의 트레이딩을 경험해보세요!",
          url: url,
        })
        .then(() => console.log("Successful share"))
        .catch((error) => console.log("Error sharing", error));
    } else {
      // clipboard
      navigator.clipboard.writeText(url);
      alert("링크가 복사되었습니다.");
    }
  }

  return (
    <Link
      href={`/posts/${id}`}
      {...getAnimationProps("up", 500, index * 100 + 200)}
      className="flex flex-col p-4 rounded-xl bg-muted gap-5 text-foreground justify-between h-full w-full max-md:gap-2"
    >
      <div className="flex flex-col gap-3 relative">
        <Image src={imageUrl} alt={title} width={320} height={50} className=" rounded-sm w-full h-[200px] object-cover" />
        {isLong ? (
          <div className="absolute top-2 right-2 bg-neutral-200 rounded-md">
            <Image src="/images/long.png" width={24} height={24} alt="long" />
            {/* <ArrowLongUpIcon className="h-6 w-6" /> */}
          </div>
        ) : (
          <div className="absolute top-2 right-2 bg-neutral-200 rounded-md">
            <Image src="/images/shorts.png" width={24} height={24} alt="shorts" />
            {/* <ArrowLongDownIcon className="h-6 w-6" /> */}
          </div>
        )}
        {isEditMode && (
          <button
            onClick={async (e) => {
              e.preventDefault();
              onDelete && onDelete();
            }}
            className="absolute top-2 right-2 text-destructive-foreground underline"
          >
            삭제
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2 flex-grow-0 ">
        <p className="text-xl font-semibold w-[320px] ">{title}</p>
        <div dangerouslySetInnerHTML={{ __html: innerHtml }} className=" h-18 w-[320px] flex-grow-0 truncate-content overflow-hidden text-ellipsis " />
      </div>
      <div className="flex flex-col gap-3 max-md:gap-1">
        <div className="flex items-center gap-4">
          <Image src={profileImageUrl || "/images/profile.png"} alt="profile" width={24} height={24} className=" rounded-sm" />
          <p className="font-bold">{profileName}</p>

          <Button
            className="text-xs font-bold max-md:p-3 "
            variant={"outline"}
            onClick={async (e) => {
              e.preventDefault();
              onFollow && onFollow();
            }}
          >
            {isFollowing ? "언팔로우" : "팔로우"}
          </Button>
        </div>
        <p className="text-sm font-medium text-muted-foreground">{formatDate(createdAt)}</p>

        <div className="flex w-full items-center justify-between">
          <Button
            className="text-xs font-bold  flex items-center gap-1 rounded-full max-md:p-3"
            variant={"outline"}
            onClick={async (e) => {
              e.preventDefault();
              onLike && onLike();
            }}
          >
            {isLiked ? <HeartIcon className="h-6 w-6 text-red-500 max-md:h-5 max-md:w-5" /> : <Heart className="h-6 w-6 max-md:h-5 max-md:w-5" />}

            <p className="text-base font-normal max-md:text-sm">{likeCount}</p>
          </Button>
          <div className="flex items-center gap-4">
            <div className="text-xs font-bold bg-muted flex gap-1 items-center">
              <ChatBubbleBottomCenterTextIcon className="h-6 w-6 max-md:h-5 max-md:w-5" />
              <span className="text-base font-normal max-md:text-sm">{commentCount}</span>
            </div>
            <div className="text-xs font-bold bg-muted ">
              <Button
                className="bg-transparent text-foreground"
                onClick={async (e) => {
                  e.preventDefault();
                  share();
                }}
              >
                <Share2Icon className="h-6 w-6  max-md:h-5 max-md:w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
