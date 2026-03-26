"use client";

import React, { MouseEvent, useState } from "react";
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
import Link from "next/link";
import { CheckIcon } from "@heroicons/react/24/solid";
import { EmailCodeModal } from "./email-code-modal";
import { createUser } from "./actions";
import { useRouter } from "next/navigation";
import { useAction } from "@/hooks/use-action";
import { sendVerificationEmail } from "@/lib/utils/send-mail";
import FileUploader from "@/components/file-uploader";
import { FileUploadModule } from "@/lib/modules/file-upload";
import { Dictionary } from "@/i18n";
import { SUPABASE_STORAGE_URL } from "@/lib/utils/get-image-url";

type TSignUpForm = {
  translations: Dictionary;
  lang: string;
};

function getRandomCode() {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
}

const inputClasses =
  "h-11 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-lg focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 focus:bg-white/[0.05] transition-all duration-200";

const SignUpForm = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TSignUpForm
>(({ translations: t, lang, ...props }, ref) => {
  const [isCheck, setIsCheck] = useState<boolean>(false);
  const [isEmailCodeModalOpen, setIsEmailCodeModalOpen] =
    useState<boolean>(false);
  const [isEmailAuthentication, setIsEmailAuthentication] =
    useState<boolean>(false);
  const [checkPassword, setCheckPassword] = useState<boolean>(false);
  const createUserAction = useAction(createUser);
  const router = useRouter();
  const [code, setCode] = useState<string>(getRandomCode());
  const formSchema = z.object({
    email: z
      .string()
      .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
        message: "이메일이 유효하지 않습니다.",
      })
      .min(2),
    name: z.string(),
    nickname: z.string(),
    password: z
      .string()
      .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*()])/, {
        message: "비밀번호가 유효하지 않습니다.",
      })
      .min(8),
    confirmPassword: z
      .string()
      .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*()])/, {
        message: "비밀번호가 유효하지 않습니다.",
      })
      .min(3),
    phoneNumber: z.string(),
    emailCode: z.string({ message: "인증코드를 입력해주세요." }),
    imageUrl: z.string(),
  });

  const checkEmailHandler = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const formValues = form.getValues();

    if (
      !formValues.email.match(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      )
    ) {
      alert("이메일 형식이 올바르지 않습니다.");
      return;
    }

    if (!formValues.password.match(/^(?=.*[0-9])(?=.*[!@#$%^&*()])/)) {
      alert("비밀번호는 숫자와 특수문자를 포함해야합니다.");
      return;
    }

    if (formValues.password.length < 8) {
      alert("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (formValues.password !== formValues.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!isCheck) {
      alert("이용약관 및 개인정보 보호 정책에 동의해주세요.");
      return;
    }

    if (!formValues.email) {
      alert("이메일을 입력해주세요.");
      return;
    }

    await sendVerificationEmail(formValues.email, code);
    setIsEmailCodeModalOpen(true);
  };

  const onSubmit = async () => {
    const response = await createUserAction(form.getValues());

    if (response) {
      alert("회원가입이 완료되었습니다.");
      router.push(`/${lang}/login`);
    } else {
      alert("아이디 또는 비밀번호가 일치하지 않습니다.");
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
      emailCode: "",
    },
  });

  return (
    <div ref={ref} {...props}>
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
                    placeholder="홍길동"
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
                    placeholder="홍길동"
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

          {/* Submit / Verify button */}
          <div className="pt-2">
            {isEmailAuthentication ? (
              <Button
                type="submit"
                className="group relative w-full h-11 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 hover:shadow-[0_0_24px_rgba(59,130,246,0.35)] transition-all duration-300 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative">{t.signup_submit}</span>
              </Button>
            ) : (
              <Button
                type="button"
                className="group relative w-full h-11 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 hover:shadow-[0_0_24px_rgba(59,130,246,0.35)] transition-all duration-300 overflow-hidden"
                onClick={checkEmailHandler}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative">{t.signup_verify}</span>
              </Button>
            )}
          </div>

          <EmailCodeModal
            form={form}
            onSubmit={onSubmit}
            code={code}
            isEmailCodeModal={isEmailCodeModalOpen}
            setIsEmailCodeModalOpen={setIsEmailCodeModalOpen}
            setIsEmailAuthentication={setIsEmailAuthentication}
          />
        </form>
      </Form>
    </div>
  );
});

SignUpForm.displayName = "SignUpForm";

export { SignUpForm };
