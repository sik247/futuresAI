import CommentTiptap from "@/components/comment-tip-tap";
import { Button } from "@/components/ui/button";
import { commentTextStore } from "@/lib/stores/rich-text-store";
import React from "react";
import { createChild } from "./actions";
import { revalidatePath } from "next/cache";
import { revalidateAll } from "@/lib/services/revalidate";
import { useRouter } from "next/navigation";
import { on } from "events";

interface TChildCommentForm {
  parentId: string;
  postId: string;
  onClicked?: () => void;
}

const ChildCommentForm = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & TChildCommentForm
>(({ parentId, postId, onClicked, ...props }, ref) => {
  const { commentText, setCommentText } = commentTextStore();
  const router = useRouter();
  return (
    <div ref={ref} {...props} className="flex flex-col gap-2">
      <CommentTiptap isComment={true} />
      <div className="flex justify-end gap-2 w-full">
        <Button
          onClick={async () => {
            const comment = await createChild({
              comment: commentText,
              parentId,
              postId,
            });

            if (!comment) {
              alert("등록되지 않았습니다.");
            }
            setCommentText("");
            alert("등록되었습니다.");
            onClicked && onClicked();
            revalidateAll(`/posts/${postId}`);
            router.push(`/posts/${postId}`);
          }}
          type="button"
          variant={"outline"}
          className=" bg-white"
        >
          입력
        </Button>
      </div>
    </div>
  );
});

ChildCommentForm.displayName = "ChildCommentForm";
export { ChildCommentForm };
