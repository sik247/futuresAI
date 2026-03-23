import React from "react";
import { ExchangeList } from "./exchange-list";
import { getAnimationProps } from "@/lib/utils/get-animation-props";
import { Exchange } from "@prisma/client";

type TExchangeListSection = {
  type: "recommended" | "new";
  exchanges: Exchange[];
};

const ExchangeListSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TExchangeListSection
>(({ exchanges, ...props }, ref) => {
  return (
    <section ref={ref} {...props} className="max-md:px-4">
      <div className="text-foreground pb-5">
        {props.type === "recommended" ? (
          <>
            <p
              className="text-2xl max-md:text-sm max-md:font-semibold font-medium pb-5 max-md:pb-2"
              {...getAnimationProps("fade", 500, 0)}
            >
              오직 당신만을 위해
            </p>
            <p
              className="text-4xl max-md:text-xl font-bold pb-5 max-md:pb-2"
              {...getAnimationProps("fade", 500, 0)}
            >
              Futures AI 추천 거래소
            </p>
          </>
        ) : (
          <p
            className="text-4xl max-md:text-xl font-bold pb-5 max-md:pb-2"
            {...getAnimationProps("fade", 500, 0)}
          >
            Futures AI 신규 거래소
          </p>
        )}

        <p
          className="text-base max-md:text-xs font-semibold text-muted-foreground"
          {...getAnimationProps("fade", 500, 300)}
        >
          업스윙을 위한 필수 셀퍼럴 플랫폼을 이용하세요!
        </p>
      </div>
      <ExchangeList exchanges={exchanges} />
    </section>
  );
});

ExchangeListSection.displayName = "ExchangeListSection";

export { ExchangeListSection };
