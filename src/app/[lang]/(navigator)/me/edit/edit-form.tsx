"use client";
import FileUploader from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploadModule } from "@/lib/modules/file-upload";
import { getAnimationProps } from "@/lib/utils/get-animation-props";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@prisma/client";
import React, { MouseEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useRouter, usePathname } from "next/navigation";
import { revalidateAll } from "@/lib/services/revalidate";
import { updateUser } from "../profile/actions";
import { SUPABASE_STORAGE_URL } from "@/lib/utils/get-image-url";

interface TEditForm {
  user: User;
}

const EditForm = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & TEditForm
>(({ user, ...props }, ref) => {
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname.split("/")[1] || "en";
  const [file, setFile] = useState<File | null>(
    new File([], "filename", { type: "image/png" })
  );

  const formSchema = z.object({
    id: z.string(),
    name: z.string(),
    nickname: z.string(),
    imageUrl: z.string(),
  });

  const onSubmit = async () => {
    const response = await updateUser(form.getValues());

    if (response) {
      alert("수정이 완료되었습니다.");
      revalidateAll("/me/refund-withdraw");
      router.push(`/${lang}/me/refund-withdraw`);
    } else {
      alert("수정이 실패하였습니다.");
    }
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: user.id,
      imageUrl: user.imageUrl,
      name: user.name,
      nickname: user.nickname,
    },
  });

  return (
    <div ref={ref} {...props}>
      <h1 className="text-3xl font-bold py-6">정보 수정</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          {...getAnimationProps("fade", 500, 0)}
          className="pb-12"
        >
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem className="mb-3">
                <FormControl>
                  <FileUploader
                    initialFile={user.imageUrl}
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

          <Label htmlFor="name" className="inline-block pb-2">
            이름
          </Label>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="mb-3">
                <FormControl>
                  <Input {...field} id="name" placeholder="홍길동" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Label htmlFor="name" className="inline-block pb-2">
            닉네임
          </Label>
          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem className="mb-3">
                <FormControl>
                  <Input {...field} id="nickname" placeholder="홍길동" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full text-base font-bold text-background bg-foreground rounded-full mt-3"
          >
            수정하기
          </Button>
        </form>
      </Form>
    </div>
  );
});

EditForm.displayName = "EditForm";
export { EditForm };
