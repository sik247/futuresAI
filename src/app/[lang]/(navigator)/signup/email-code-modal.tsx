"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

type TEmailCodeModal = {
  form: UseFormReturn<{
    imageUrl: string;
    email: string;
    name: string;
    nickname: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    emailCode: string;
  }>;
  onSubmit: () => void;
  code: string;
  isEmailCodeModal: boolean;
  setIsEmailCodeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEmailAuthentication: React.Dispatch<React.SetStateAction<boolean>>;
};

const EmailCodeModal = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TEmailCodeModal
>((props, ref) => {
  const checkCodeHandler = () => {
    if (props.form.getValues("emailCode") === props.code) {
      props.setIsEmailAuthentication(true);
      alert("이메일 인증을 완료했습니다.");
      props.setIsEmailCodeModalOpen(false);
      props.onSubmit();
    } else {
      alert("인증번호가 일치하지 않습니다.");
    }
  };

  return (
    <Dialog open={props.isEmailCodeModal}>
      <DialogContent className="border-none max-md:w-[90%]">
        <div className="absolute right-4 top-4 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-muted data-[state=open]:text-muted-foreground">
          <XMarkIcon
            className="h-4 w-4"
            onClick={() => {
              props.setIsEmailCodeModalOpen(false);
            }}
          />
        </div>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground text-start">
            보내드린 인증번호 4자리를 <br />
            입력해주세요
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold text-muted-foreground text-start">
            {props.form.getValues("email")}
          </DialogDescription>
        </DialogHeader>
        <div>
          <FormField
            control={props.form.control}
            name="emailCode"
            render={({ field }) => (
              <FormItem className="mb-12">
                <FormControl>
                  <Input
                    {...field}
                    className="border-foreground rounded-2xl"
                    placeholder="인증번호를 입력해주세요."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <span className="text-xs font-medium text-muted-foreground pt-6 inline-block">
            인증번호가 오지 않았다면, <br />
            <p className="text-foreground inline-block">60초</p> 뒤에 나오는
            다시보내기 버튼을 눌러주세요.
          </span>
        </div>
        <div className="flex justify-start items-center">
          <p className="text-xs font-medium text-muted-foreground">
            문제가 있으세요?
          </p>
          <Link
            href={"/example.com"}
            className="text-foreground text-xs font-medium px-2 underline"
          >
            고객센터 연결
          </Link>
        </div>
        <DialogFooter className="md:justify-start max-md:flex-col">
          <Button
            variant={"default"}
            type="submit"
            className="w-full rounded-full bg-foreground text-background"
            onClick={checkCodeHandler}
          >
            인증하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

EmailCodeModal.displayName = "EmailCodeModal";

export { EmailCodeModal };
