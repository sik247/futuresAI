"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAnimationProps } from "@/lib/utils/get-animation-props";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "@/components/ui/use-toast";
import { revalidateAll } from "@/lib/services/revalidate";

type TLoginForm = {};

const LoginForm = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TLoginForm
>((props, ref) => {
  const router = useRouter();
  const formSchema = z.object({
    email: z
      .string()
      .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
        message: "이메일이 유효하지 않습니다.",
      })
      .min(2),
    password: z
      .string()
      .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*()])/, {
        message: "비밀번호가 유효하지 않습니다.",
      })
      .min(8),
    autoLogin: z.boolean(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      autoLogin: false,
    },
  });

  async function handleSubmit() {
    const formData = form.getValues();
    try {
      const res = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        callbackUrl: "/me",
        redirect: false,
      });
      if (res?.error) {
        toast({
          title: "로그인 실패",
          description: "이메일 또는 비밀번호가 올바르지 않습니다.",
        });
      } else {
        revalidateAll("/me/refund-withdraw");
        router.push("/me/refund-withdraw");
      }
    } catch (error) {
      toast({
        title: "로그인 실패",
        description: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }
  }

  return (
    <div ref={ref} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="mb-3" {...getAnimationProps("up", 500, 0)}>
                <FormControl>
                  <Input {...field} placeholder="이메일" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem
                className="mb-12"
                {...getAnimationProps("up", 500, 200)}
              >
                <FormControl>
                  <Input {...field} type="password" placeholder="비밀번호" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            {...getAnimationProps("up", 500, 300)}
            type="submit"
            className="w-full text-base font-bold text-background bg-foreground rounded-full"
          >
            로그인
          </Button>
        </form>
      </Form>
    </div>
  );
});

LoginForm.displayName = "LoginForm";

export { LoginForm };
