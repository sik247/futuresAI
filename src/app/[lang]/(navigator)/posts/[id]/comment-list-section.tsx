import { Comment, Prisma } from "@prisma/client";
import React from "react";
import { ParentCommentCard } from "./parent-comment-card";

interface TCommentListSection {
  comments: Prisma.CommentGetPayload<{
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
  }>[];
}

const CommentListSection = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & TCommentListSection
>(({ comments, ...props }, ref) => {
  return (
    <div ref={ref} {...props} className="flex flex-col gap-7 py-8">
      {comments.map((comment, index) => {
        return <ParentCommentCard key={index} comment={comment} />;
      })}
    </div>
  );
});

CommentListSection.displayName = "CommentListSection";
export { CommentListSection };
