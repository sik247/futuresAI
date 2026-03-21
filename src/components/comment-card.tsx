"use client";
import {
  createCommentLikes,
  deleteCommentLikes,
  getCommentLike,
} from "@/app/[lang]/(navigator)/posts/[id]/actions";
import { ChildCommentForm } from "@/app/[lang]/(navigator)/posts/[id]/child-comment-form";
import { UpdateCommentForm } from "@/app/[lang]/(navigator)/posts/[id]/update-comment-form";
import { Button } from "@/components/ui/button";
import { revalidateAll } from "@/lib/services/revalidate";
import { commentTextStore, richTextStore } from "@/lib/stores/rich-text-store";
import { formatDate } from "@/lib/utils/date-fomatting";
import {
  ChatBubbleBottomCenterTextIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon } from "@heroicons/react/24/solid";
import { CommentLike } from "@prisma/client";
import { Heart, Pencil, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import React, { useEffect } from "react";
import HTMLRenderer from "./html-renderer";

interface TCommentCard {
  postId: string;
  isChild?: boolean;
  onLikeClick: () => void;
  imageUrl: string;
  userName: string;
  content: string;
  likeCount: number;
  createdAt: Date;
  id: string;
}

const CommentCard = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & TCommentCard
>(
  (
    {
      postId,
      isChild = false,
      onLikeClick,
      imageUrl,
      userName,
      content,
      likeCount,
      createdAt,
      id,
      ...props
    },
    ref
  ) => {
    const session = useSession();
    const [open, setOpen] = React.useState(false);
    const [isUpdateMode, setIsUpdateMode] = React.useState(false);
    const [isLiked, setIsLiked] = React.useState<boolean>(false);
    const [commentLike, setCommentLike] = React.useState<CommentLike>();

    useEffect(() => {
      const email = session?.data?.user.email;

      if (!email) {
        return;
      }

      getCommentLike(id, email).then((like) => {
        if (!like) {
          setIsLiked(false);
          return;
        }
        setCommentLike(like);
        setIsLiked(true);
      });
    }, [session]);

    const { setCommentText } = commentTextStore();

    return (
      <div ref={ref} {...props} className="flex flex-col gap-2">
        <div
          className={`flex flex-col gap-2 ${
            isChild ? "  border-l-2 border-foreground" : ""
          }`}
        >
          <div className="flex w-full items-start justify-between">
            <div className={`flex flex-col gap-2 ${isChild ? " pl-2" : ""}`}>
              <div className={`flex gap-2 ${isChild ? " pl-2" : ""}`}>
                <Image
                  src={imageUrl}
                  alt="profile"
                  width={40}
                  height={40}
                  className=" rounded-full object-cover"
                />
                <div className="flex flex-col gap-1">
                  <p className="text-sm">{userName}</p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {formatDate(createdAt)}
                  </p>
                </div>
              </div>
              {content && <HTMLRenderer html={content} renderMode="text" />}

              <div className="flex w-full items-center gap-4">
                <Button
                  type="button"
                  className="text-xs font-bold  flex items-center gap-1 rounded-full bg-white"
                  variant={"outline"}
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!isLiked) {
                      const commentLike = await createCommentLikes(id);
                      revalidateAll(`posts/${postId}`);
                      setCommentLike(commentLike);
                      setIsLiked(true);
                    } else {
                      if (!commentLike) {
                        return;
                      }
                      await deleteCommentLikes(commentLike.id);
                      revalidateAll(`posts/${postId}`);
                      setIsLiked(false);
                    }
                  }}
                >
                  {isLiked ? (
                    <HeartIcon className="h-6 w-6 text-red-500" />
                  ) : (
                    <Heart className="h-6 w-6 " />
                  )}
                  <p className="text-base font-normal">{likeCount}</p>
                </Button>
                {open ? (
                  <Button
                    onClick={() => setOpen(false)}
                    type="button"
                    className={`text-xs font-bold  flex items-center gap-1 rounded-full bg-white ${
                      isUpdateMode ? "hidden" : ""
                    }`}
                  >
                    <X className="h-6 w-6" />
                    <p className="text-base font-normal">닫기</p>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      setOpen(!open);
                    }}
                    className={`flex items-center gap-4 bg-white ${
                      isUpdateMode ? "hidden" : ""
                    }`}
                  >
                    <div className="text-xs font-bold  flex gap-1 items-center">
                      <ChatBubbleBottomCenterTextIcon className="h-6 w-6" />
                      <span className="text-base font-normal">응답</span>
                    </div>
                  </Button>
                )}
              </div>
            </div>
            <div>
              {isUpdateMode ? (
                <Button
                  type="button"
                  onClick={() => {
                    setIsUpdateMode(!isUpdateMode);
                  }}
                  className={`flex items-center gap-4 bg-white ${
                    open ? "hidden" : ""
                  }`}
                >
                  <div className="text-xs font-bold  flex gap-1 items-center">
                    <X className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-normal text-muted-foreground">
                      수정취소
                    </span>
                  </div>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    if (!isUpdateMode) {
                      setCommentText(content);
                      setIsUpdateMode(!isUpdateMode);
                    } else {
                      setIsUpdateMode(!isUpdateMode);
                    }
                  }}
                  className={`flex items-center gap-4 bg-white ${
                    open ? "hidden" : ""
                  }`}
                >
                  <div className="text-xs font-bold  flex gap-1 items-center">
                    <PencilSquareIcon className="h-4 w-4 text-muted-foreground" />
                    <span className=" text-sm font-normal text-muted-foreground">
                      수정하기
                    </span>
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>
        {isUpdateMode && (
          <UpdateCommentForm
            commentId={id}
            postId={postId}
            onClicked={() => {
              setIsUpdateMode(false);
            }}
          />
        )}
        {open && (
          <ChildCommentForm
            parentId={id}
            postId={postId}
            onClicked={() => setOpen(false)}
          />
        )}
      </div>
    );
  }
);

CommentCard.displayName = "CommentCard";
export { CommentCard };
