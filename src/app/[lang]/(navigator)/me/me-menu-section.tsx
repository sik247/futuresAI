"use client";

import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { User } from "@prisma/client";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";

type TMeMenuSection = {};

const MeMenuSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TMeMenuSection
>(({ ...props }, ref) => {
  const router = useRouter();
  const signOutHandler = () => {
    signOut({ redirect: true });
    alert("로그아웃 되었습니다.");
  };

  return (
    <section ref={ref} {...props} className="py-6">
      <div className="text-base font-semibold text-foreground grid grid-cols-1 gap-2">
        <Button
          variant={"secondary"}
          className="w-full justify-between text-base font-semibold text-foreground bg-background"
          onClick={() => router.push("/me/edit")}
        >
          <p>정보 수정</p>
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
        <Button
          variant={"secondary"}
          onClick={() => router.push("/me/refund-withdraw")}
          className="w-full justify-between text-base font-semibold text-foreground bg-background md:hidden"
        >
          출금 및 환급 내역
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
        <Button
          variant={"secondary"}
          onClick={() => router.push("/me/profile")}
          className="w-full justify-between text-base font-semibold text-foreground bg-background md:hidden"
        >
          프로필 관리
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
        <Button
          variant={"secondary"}
          onClick={signOutHandler}
          className="w-full justify-between text-base font-semibold text-foreground bg-background"
        >
          로그아웃
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
      </div>
    </section>
  );
});

MeMenuSection.displayName = "MeMenuSection";

export { MeMenuSection };
