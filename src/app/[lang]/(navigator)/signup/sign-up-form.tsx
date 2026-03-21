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
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { CheckIcon } from "@heroicons/react/24/solid";
import { EmailCodeModal } from "./email-code-modal";
import { getAnimationProps } from "@/lib/utils/get-animation-props";
import { createUser } from "./actions";
import { useRouter } from "next/navigation";
import { useAction } from "@/hooks/use-action";
import { sendVerificationEmail } from "@/lib/utils/send-mail";
import FileUploader from "@/components/file-uploader";
import { FileUploadModule } from "@/lib/modules/file-upload";

type TSignUpForm = {};

function getRandomCode() {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
}

const SignUpForm = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TSignUpForm
>((props, ref) => {
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
      router.push("/login");
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
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          {...getAnimationProps("fade", 500, 0)}
          className="pb-12"
        >
          <Label htmlFor="email" className="inline-block pb-2">
            프로필 이미지
          </Label>
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem className="mb-3">
                <FormControl>
                  <FileUploader
                    onChange={async (files) => {
                      if (files.length < 1) return;
                      const file = files[0];
                      if (
                        file.name.includes(
                          "https://nkkuehjtdudabogzwibw.supabase.co/storage/v1/object/public/CryptoX/"
                        )
                      ) {
                        field.onChange({ target: { value: file.name } });
                        return;
                      }
                      const fileUploader = new FileUploadModule();
                      const data = await fileUploader.upload(file);
                      const fileUrl =
                        ("https://nkkuehjtdudabogzwibw.supabase.co/storage/v1/object/public/CryptoX/" +
                          data.path) as string;
                      field.onChange({ target: { value: fileUrl } });
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Label htmlFor="email" className="inline-block pb-2">
            이메일
          </Label>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="mb-3">
                <FormControl>
                  <Input
                    {...field}
                    id="email"
                    placeholder="example@example.com"
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
          <Label htmlFor="password" className="inline-block pb-2">
            비밀번호
          </Label>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="mb-3">
                <FormControl>
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    placeholder="비밀번호를 입력해주세요."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Label htmlFor="confirmPassword" className="inline-block pb-2">
            비밀번호 확인
          </Label>
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="mb-3">
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    id="confirmPassword"
                    placeholder="비밀번호를 다시 입력해주세요."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Label htmlFor="phoneNumber" className="inline-block pb-2">
            전화번호
          </Label>
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem className="mb-12">
                <FormControl>
                  <Input
                    {...field}
                    id="phoneNumber"
                    placeholder="010-1234-1234"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-start items-center mb-12 text-sm max-md:text-xs font-medium text-foreground rounded-xl border border-border bg-background p-4">
            <div
              className={`inline-block rounded-sm p-1 mr-3 ${
                isCheck ? "bg-foreground" : "bg-muted-foreground"
              }`}
              onClick={() => setIsCheck((prev) => (prev ? false : true))}
            >
              <CheckIcon className="text-background w-3" />
            </div>
            <span>
              저는 크립토엑스의{" "}
              <p className="inline-block text-muted-foreground">이용약관</p> 및{" "}
              <br className="md:invisible visible" />
              <p className="inline-block text-muted-foreground">
                개인정보 보호 정책
              </p>{" "}
              을 읽고 동의합니다.
            </span>
          </div>
          <div className="mb-12 text-sm font-medium text-muted-foreground text-center">
            <p>이미 계정이 있으신가요?</p>
            <Link href={"/login"}>
              <p className="text-foreground">로그인</p>
            </Link>
          </div>
          {isEmailAuthentication ? (
            <Button
              type="submit"
              className="w-full text-base font-bold text-background bg-primary-foreground rounded-full"
            >
              가입하기
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full text-base font-bold text-background bg-foreground rounded-full "
              onClick={checkEmailHandler}
            >
              인증하기
            </Button>
          )}
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
