import Container from "@/components/ui/container";
import React from "react";
import { SignUpForm } from "./sign-up-form";
import { getAnimationProps } from "@/lib/utils/get-animation-props";

type TSignUpPage = {};

const SignUpPage: React.FC<TSignUpPage> = ({}) => {
  return (
    <div className="bg-muted">
      <Container className="bg-background pt-16 px-6 min-h-screen">
        <div className="mb-8">
          <span
            className="text-xl font-bold text-foreground inline-block mb-3"
            {...getAnimationProps("fade", 500, 0)}
          >
            선물 거래{" "}
            <p className="text-muted-foreground inline-block">
              수수료 페이백 크립토엑스
            </p>
            에 <br />
            오신 것을 환영합니다
          </span>
          <p
            className="text-sm max-md:text-xs font-medium text-muted-foreground"
            {...getAnimationProps("fade", 500, 200)}
          >
            크립토엑스는 거래소에서 발생한 수수료를 <br />
            트레이더님들께 직접 환급해주는 페이백 서비스에요.
          </p>
        </div>
        <SignUpForm />
      </Container>
    </div>
  );
};

export default SignUpPage;
