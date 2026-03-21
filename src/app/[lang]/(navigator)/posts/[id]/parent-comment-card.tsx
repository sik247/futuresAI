"use client";
import { Prisma } from "@prisma/client";
import React from "react";
import { CommentCard } from "@/components/comment-card";

interface TParentCommentCard {
  comment: Prisma.CommentGetPayload<{
    include: {
      user: true;
      likes: true;

      Children: {
        include: {
          user: true;
          likes: true;
        };
      };
    };
  }>;
}

const ParentCommentCard = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & TParentCommentCard
>(({ comment, ...props }, ref) => {
  return (
    <div ref={ref} {...props} className="flex flex-col gap-7">
      <CommentCard
        imageUrl={comment.user.imageUrl || "/images/profile.png"}
        userName={comment.user.nickname}
        content={comment.content}
        likeCount={comment.likes.length || 0}
        createdAt={comment.createdAt}
        id={comment.id}
        onLikeClick={() => {}}
        postId={comment.postId}
      />
      {comment.Children.map((childComment, index) => {
        return (
          <CommentCard
            key={index}
            isChild={true}
            imageUrl={childComment.user.imageUrl || "/images/profile.png"}
            userName={childComment.user.nickname}
            content={childComment.content}
            likeCount={childComment.likes.length || 0}
            createdAt={childComment.createdAt}
            id={comment.id}
            onLikeClick={() => {}}
            postId={comment.postId}
          />
        );
      })}
    </div>
  );
});

ParentCommentCard.displayName = "ParentCommentCard";
export { ParentCommentCard };
