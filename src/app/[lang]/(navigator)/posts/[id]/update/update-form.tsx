"use client";
import FileUploader from "@/components/file-uploader";
import Tiptap from "@/components/tip-tap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FileUploadModule } from "@/lib/modules/file-upload";
import { zodResolver } from "@hookform/resolvers/zod";
import { File } from "buffer";
import { sub } from "date-fns";
import React, { useEffect, useState } from "react";
import { ControllerRenderProps, FieldValues, useForm } from "react-hook-form";
import { z } from "zod";

import { useRouter } from "next/navigation";
import { richTextStore } from "@/lib/stores/rich-text-store";
import { Checkbox } from "@/components/ui/checkbox";
import { updatePostAction } from "./actions";
import { Post } from "@prisma/client";
import { X } from "lucide-react";
import { revalidateAll } from "@/lib/services/revalidate";
import { SUPABASE_STORAGE_URL } from "@/lib/utils/get-image-url";

type TPostUpdateForm = {
  id: string;
  post: Post;
};
export const formSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  title: z.string(),
  isLong: z.boolean(),
  content: z.string(),
});

const PostUpdateForm: React.FC<TPostUpdateForm> = ({ id, post }) => {
  const { richText, setRichText } = richTextStore();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: id,
      imageUrl: post.imageUrl,
      title: post.title,
      isLong: post.isLong,
      content: post.content,
    },
  });

  useEffect(() => {
    setRichText(post.content);
    return () => {
      setRichText("");
    };
  }, []);

  async function onSubmit() {
    form.setValue("content", richText);
    const formData = form.getValues();
    const response = await updatePostAction(formData);
    setRichText("");
    revalidateAll(`/posts/${id}`);

    if (response.serverError) {
      alert("수정되지 않았습니다.");
      return;
    }
    alert("수정되었습니다.");
    router.push(`/posts/${id}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6 py-10 w-full"
      >
        <div className="flex">
          <span className=" font-bold text-4xl max-md:text-2xl">
            글 수정하기
          </span>
        </div>
        <div className="flex flex-col gap-3 max-md:gap-0">
          <p className="text-foreground max-md:text-sm">
            작성 관점을 선택해주세요
          </p>
          <div className="flex items-center gap-10">
            <FormField
              control={form.control}
              name="isLong"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center h-10 gap-2">
                    <FormControl>
                      <>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </>
                    </FormControl>
                    <span className="text-sm text-muted-foreground">롱</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isLong"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center h-10 gap-2">
                    <FormControl>
                      <>
                        <Checkbox
                          checked={!field.value}
                          onCheckedChange={(value) => field.onChange(!value)}
                        />
                      </>
                    </FormControl>
                    <span className="text-sm text-muted-foreground">숏</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FileUploader
                  labelText="썸네일을 업로드 해주세요"
                  initialFile={post.imageUrl}
                  onChange={async (files) => {
                    if (files.length < 1) return;
                    const file = files[0];
                    if (
                      file.name.includes(
                        SUPABASE_STORAGE_URL
                      )
                    ) {
                      field.onChange({ target: { value: file.name } });
                      return;
                    }
                    const fileUploader = new FileUploadModule();
                    const data = await fileUploader.upload(file);
                    const fileUrl =
                      (SUPABASE_STORAGE_URL +
                        data.path) as string;
                    field.onChange({ target: { value: fileUrl } });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-3 w-full">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="제목을 입력해주세요" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <>
              <FormControl>
                {/* <RichTextEditor /> */}
                <Tiptap />
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
  );
};

export default PostUpdateForm;
