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
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "@/components/ui/use-toast";
import { revalidateAll } from "@/lib/services/revalidate";
import { Dictionary } from "@/i18n";

type TLoginForm = {
  translations: Dictionary;
  lang?: string;
};

const LoginForm = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TLoginForm
>(({ translations: t, lang, ...props }, ref) => {
  const ko = lang === "ko";
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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                  {ko ? "이메일" : "Email"}
                </label>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    placeholder={t.login_email_placeholder}
                    className="h-11 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-lg focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 focus:bg-white/[0.05] transition-all duration-200"
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-xs mt-1.5" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                  {ko ? "비밀번호" : "Password"}
                </label>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="current-password"
                    placeholder={t.login_password_placeholder}
                    className="h-11 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-lg focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 focus:bg-white/[0.05] transition-all duration-200"
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-xs mt-1.5" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="group relative w-full h-11 mt-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 hover:shadow-[0_0_24px_rgba(59,130,246,0.35)] transition-all duration-300 overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative">{t.login_submit}</span>
          </Button>
        </form>
      </Form>
    </div>
  );
});

LoginForm.displayName = "LoginForm";

export { LoginForm };
