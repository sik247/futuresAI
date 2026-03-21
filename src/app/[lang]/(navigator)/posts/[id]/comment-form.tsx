"use client";
import Tiptap from "@/components/tip-tap";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { richTextStore } from "@/lib/stores/rich-text-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createCommentAction } from "./actions";
import { revalidatePath } from "next/cache";
import { revalidateAll } from "@/lib/services/revalidate";
import { set } from "date-fns";

interface TCommentForm {
  postId: string;
  commentLength: number;
}
export const formSchema = z.object({
  comment: z.string(),
  postId: z.string(),
});

const CommentForm = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & TCommentForm
>(({ postId, commentLength, ...props }, ref) => {
  const { richText, setRichText } = richTextStore();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      postId: postId,
      comment: "",
    },
  });

  useEffect(() => {
    return () => {
      setRichText("");
    };
  }, []);

  async function onSubmit() {
    form.setValue("comment", richText);
    const formData = form.getValues();

    const response = await createCommentAction(formData);

    if (response.serverError) {
      alert("등록되지 않았습니다.");
      return;
    }
    alert("등록되었습니다.");

    setRichText("");
    revalidateAll(`/posts/${postId}`);
    router.push(`/posts/${postId}`);
  }

  return (
    <div ref={ref} {...props} className="w-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 w-full"
        >
          <p>댓글 {commentLength}</p>
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <>
                <FormControl>
                  {/* <RichTextEditor /> */}
                  <Tiptap isComment />
                </FormControl>
              </>
            )}
          />
          <div className="flex justify-end gap-2 w-full">
            <Button type="submit" variant={"outline"} className=" bg-white">
              입력
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
});

CommentForm.displayName = "CommentForm";
export { CommentForm };
