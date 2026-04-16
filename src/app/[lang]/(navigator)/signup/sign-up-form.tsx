"use client";

import React, { useState } from "react";
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
import { CheckIcon } from "@heroicons/react/24/solid";
import { createUser } from "./actions";
import { useRouter } from "next/navigation";
import { useAction } from "@/hooks/use-action";
import FileUploader from "@/components/file-uploader";
import { FileUploadModule } from "@/lib/modules/file-upload";
import { Dictionary } from "@/i18n";
import { SUPABASE_STORAGE_URL } from "@/lib/utils/get-image-url";
import { SocialLoginButtons } from "../login/social-login-buttons";

type TSignUpForm = {
  translations: Dictionary;
  lang: string;
};

const inputClasses =
  "h-11 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-lg focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 focus:bg-white/[0.05] transition-all duration-200";

const SignUpForm = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TSignUpForm
>(({ translations: t, lang, ...props }, ref) => {
  const [isCheck, setIsCheck] = useState<boolean>(false);
  const createUserAction = useAction(createUser);
  const router = useRouter();
  const ko = lang === "ko";

  const formSchema = z.object({
    email: z
      .string()
      .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
        message: ko ? "이메일이 유효하지 않습니다." : "Invalid email address.",
      })
      .min(2),
    name: z.string(),
    nickname: z.string(),
    password: z
      .string()
      .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*()])/, {
        message: ko ? "비밀번호는 숫자와 특수문자를 포함해야합니다." : "Password must include numbers and special characters.",
      })
      .min(8),
    confirmPassword: z
      .string()
      .min(3),
    phoneNumber: z.string(),
    imageUrl: z.string(),
  });

  const onSubmit = async () => {
    const values = form.getValues();

    if (values.password !== values.confirmPassword) {
      alert(ko ? "비밀번호가 일치하지 않습니다." : "Passwords do not match.");
      return;
    }

    if (!isCheck) {
      alert(ko ? "이용약관 및 개인정보 보호 정책에 동의해주세요." : "Please agree to the terms and privacy policy.");
      return;
    }

    const response = await createUserAction(values);

    if (response) {
      alert(ko ? "회원가입이 완료되었습니다." : "Account created successfully.");
      router.push(`/${lang}/login`);
    } else {
      alert(ko ? "회원가입에 실패했습니다. 이메일이 이미 사용 중일 수 있습니다." : "Sign up failed. Email may already be in use.");
    }
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      imageUrl: "",
      name: "",
      nickname: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
    },
  });

  return (
    <div ref={ref} {...props}>
      {/* Telegram quick signup */}
      <div className="mb-6">
        <SocialLoginButtons lang={lang} />
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <span className="relative bg-zinc-950 px-4 text-xs text-zinc-500 uppercase tracking-wider">
            {ko ? "또는 이메일로 가입" : "or sign up with email"}
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Profile Image */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
              {t.signup_profile_image}
            </label>
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FileUploader
                      onChange={async (files) => {
                        if (files.length < 1) return;
                        const file = files[0];
                        if (
                          file.name.includes(SUPABASE_STORAGE_URL)
                        ) {
                          field.onChange({ target: { value: file.name } });
                          return;
                        }
                        const fileUploader = new FileUploadModule();
                        const data = await fileUploader.upload(file);
                        const fileUrl =
                          (SUPABASE_STORAGE_URL + data.path) as string;
                        field.onChange({ target: { value: fileUrl } });
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                  {t.signup_email}
                </label>
                <FormControl>
                  <Input
                    {...field}
                    id="email"
                    placeholder="example@example.com"
                    className={inputClasses}
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                  {t.signup_name}
                </label>
                <FormControl>
                  <Input
                    {...field}
                    id="name"
                    placeholder={ko ? "홍길동" : "John Doe"}
                    className={inputClasses}
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          {/* Nickname */}
          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                  {t.signup_nickname}
                </label>
                <FormControl>
                  <Input
                    {...field}
                    id="nickname"
                    placeholder={ko ? "닉네임" : "Nickname"}
                    className={inputClasses}
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                  {t.signup_password}
                </label>
                <FormControl>
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    placeholder="********"
                    className={inputClasses}
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                  {t.signup_confirm_password}
                </label>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    id="confirmPassword"
                    placeholder="********"
                    className={inputClasses}
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          {/* Phone Number */}
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                  {t.signup_phone}
                </label>
                <FormControl>
                  <Input
                    {...field}
                    id="phoneNumber"
                    placeholder="010-1234-1234"
                    className={inputClasses}
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          {/* Terms checkbox */}
          <div className="pt-2">
            <div
              className="flex items-start gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 cursor-pointer select-none"
              onClick={() => setIsCheck((prev) => !prev)}
            >
              <div
                className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-all duration-200 ${
                  isCheck
                    ? "bg-blue-600 border-blue-600"
                    : "bg-white/[0.05] border border-white/[0.15]"
                }`}
              >
                {isCheck && <CheckIcon className="text-white w-3.5 h-3.5" />}
              </div>
              <span className="text-sm text-zinc-300 leading-relaxed">
                {t.signup_terms_agree}{" "}
                <span className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  {t.signup_terms}
                </span>{" "}
                {t.signup_and}{" "}
                <span className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  {t.signup_privacy}
                </span>
              </span>
            </div>
          </div>

          {/* Submit button — direct, no email verification */}
          <div className="pt-2">
            <Button
              type="submit"
              className="group relative w-full h-11 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 hover:shadow-[0_0_24px_rgba(59,130,246,0.35)] transition-all duration-300 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">{t.signup_submit}</span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
});

SignUpForm.displayName = "SignUpForm";

export { SignUpForm };
