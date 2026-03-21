import Container from "@/components/ui/container";
import React from "react";
import { LoginForm } from "./login-form";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAnimationProps } from "@/lib/utils/get-animation-props";

type TLoginPage = {};

const LoginPage: React.FC<TLoginPage> = ({}) => {
  return (
    <div className="bg-muted">
      <Container className="bg-background pt-16 px-6 min-h-screen">
        <div className="mb-8">
          <p
            className="text-xl font-bold text-foreground"
            {...getAnimationProps("left", 500, 0)}
          >
            로그인
          </p>
          <span
            className="text-sm max-md:text-xs font-medium text-muted-foreground"
            {...getAnimationProps("right", 500, 200)}
          >
            주요 거래소와{" "}
            <p className="text-foreground inline-block">공식 계약을 체결</p>
            한 곳은 오직 크립토엑스 뿐이에요.
            <br />
            회원이라면 누구나 다양한 미션을 수행하고 USDT를 받아보세요.
          </span>
        </div>
        <LoginForm />
        <div
          className="flex justify-center items-center max-w-6xl py-6"
          {...getAnimationProps("fade", 500, 500)}
        >
          <Separator className="shrink" />
          <p className="bg-background p-4 text-xs font-normal text-muted-foreground shrink-0">
            또는
          </p>
          <Separator className="shrink" />
        </div>
        <Link href={"/signup"} {...getAnimationProps("up", 500, 500)}>
          <Button className="w-full rounded-full bg-background border border-muted-foreground text-base font-medium text-foreground">
            회원가입
          </Button>
        </Link>
      </Container>
    </div>
  );
};

export default LoginPage;
