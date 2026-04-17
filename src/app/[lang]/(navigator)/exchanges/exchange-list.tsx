"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { getAnimationProps } from "@/lib/utils/get-animation-props";
import { Exchange } from "@prisma/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

type TExchangeList = {
  exchanges: Exchange[];
};

const ExchangeList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TExchangeList
>(({ exchanges, ...props }, ref) => {
  const router = useRouter();

  return (
    <div ref={ref} {...props}>
      <ul className="grid grid-cols-3 max-md:grid-cols-1 gap-4">
        {exchanges.map((exchange, idx) => (
          <Card
            key={exchange.id}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300"
            {...getAnimationProps("up", 500, idx * 100 + 200)}
          >
            <CardHeader className="p-4">
              <p className="text-sm font-semibold text-foreground">
                {exchange.name}
              </p>
              <p className="text-lg font-bold text-foreground">
                페이백 {Math.round(exchange.paybackRatio * 100)}%
              </p>
            </CardHeader>
            <CardContent className="px-4">
              <Badge className="mb-4 bg-muted text-xs font-medium text-foreground rounded-md p-2">
                마감 예정이에요!
              </Badge>
              <div className="relative w-full h-24 mb-3 rounded-lg overflow-hidden bg-white/[0.02]">
                <Image
                  src={exchange.imageUrl}
                  alt={exchange.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain p-4"
                />
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                <p>제휴 거래소 페이백 {Math.round(exchange.paybackRatio * 100)}%</p>
                <p className="text-foreground">
                  {"1인 평균 161만원 벌었어요!"}
                </p>
              </div>
            </CardContent>
            <CardFooter className="px-4 pb-4">
              <Button
                className="rounded-3xl w-full px-16 py-6 bg-foreground text-background text-base font-bold"
                onClick={() => {
                  router.push(`/exchanges/${exchange.id}`);
                }}
              >
                페이백 시작하기
              </Button>
            </CardFooter>
          </Card>
        ))}
      </ul>
    </div>
  );
});

ExchangeList.displayName = "ExchangeList";

export { ExchangeList };
