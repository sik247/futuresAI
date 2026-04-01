"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type THearSelection = {};

const HearSelection: React.FC<THearSelection> = ({}) => {
  const pathname = usePathname();
  const pathnameArr = pathname.split("/");
  const lang = pathnameArr[1] === "ko" || pathnameArr[1] === "en" ? pathnameArr[1] : "en";

  function getBackgroundColor(isMePage: boolean) {
    return isMePage ? "bg-black" : "bg-background";
  }

  function getTextColor(isMePage: boolean) {
    return isMePage ? "text-white" : "text-muted-foreground";
  }

  return (
    <div className="flex items-center mx-2">
      <Link
        href={"/"}
        className={` w-20 py-1 text-sm font-normal text-center rounded-md ${getBackgroundColor(pathnameArr[1] !== "me")} ${getTextColor(
          pathnameArr[1] !== "me"
        )}`}
      >
        홈
      </Link>
      <Link
        href={`/${lang}/me/refund-withdraw`}
        className={` w-20 py-1 text-sm font-normal text-center rounded-md ${getBackgroundColor(pathnameArr[1] === "me")} ${getTextColor(
          pathnameArr[1] === "me"
        )}`}
      >
        대쉬보드
      </Link>
    </div>
  );
};

export default HearSelection;
