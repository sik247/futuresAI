"use client";

import { Button } from "@/components/ui/button";
import { Exchange } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React from "react";

type TDetailHeader = {
  exchange: Exchange;
};

const DetailHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TDetailHeader
>(
  (
    {
      exchange: {
        name,
        paybackRatio,
        limitFee,
        marketFee,
        imageUrl,
        link,
        ...exchange
      },
      ...props
    },
    ref
  ) => {
    paybackRatio = paybackRatio;
    return (
      <header
        ref={ref}
        {...props}
        className="flex max-md:flex-col max-md:items-start max-md:gap-4 justify-between items-center"
      >
        <div className="text-foreground">
          <p className="text-2xl font-extrabold pb-2">{name}</p>
          <p className="text-base font-bold pb-2">
            수수료 페이백 {paybackRatio.toFixed(0)}%
          </p>
          <p className="text-muted-foreground text-xs font-bold">
            페이백을 감안한 수수료율 <br />
            지정가 {limitFee}% 시장가 {marketFee}%
          </p>
          <div className="h-4"></div>
          <Link href={link}>
            <Button
              size={"lg"}
              className="font-bold bg-foreground text-background"
            >
              페이백 시작하기
            </Button>
          </Link>
        </div>
        <Image src={imageUrl} alt="" width={400} height={168} />
      </header>
    );
  }
);

DetailHeader.displayName = "DetailHeader";

export { DetailHeader };
