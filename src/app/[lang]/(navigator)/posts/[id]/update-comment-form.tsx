import CommentTiptap from "@/components/comment-tip-tap";
import { Button } from "@/components/ui/button";
import { commentTextStore } from "@/lib/stores/rich-text-store";
import React from "react";
import { createChild, updateComment } from "./actions";
import { revalidatePath } from "next/cache";
import { revalidateAll } from "@/lib/services/revalidate";
import { useRouter } from "next/navigation";

interface TUpdateCommentForm {
  commentId: string;
  postId: string;
  onClicked?: () => void;
}

const UpdateCommentForm = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & TUpdateCommentForm
>(({ commentId, postId, onClicked, ...props }, ref) => {
  const { commentText, setCommentText } = commentTextStore();
  const router = useRouter();
  return (
    <div ref={ref} {...props} className="flex flex-col gap-2">
      <CommentTiptap isComment={true} />
      <div className="flex justify-end gap-2 w-full">
        <Button
          onClick={async () => {
            const comment = await updateComment(commentId, commentText);

            if (!comment) {
              alert("수정되지 않았습니다.");
            }
            setCommentText("");
            alert("수정되었습니다.");

            revalidateAll(`/posts/${postId}`);
            onClicked && onClicked();
            router.push(`/posts/${postId}`);
          }}
          type="button"
          variant={"outline"}
          className=" bg-white"
        >
          수정하기
        </Button>
      </div>
    </div>
  );
});

UpdateCommentForm.displayName = "UpdateCommentForm";
export { UpdateCommentForm };
