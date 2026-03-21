import Chart from "@/app/components/chart";
import { getAnimationProps } from "@/lib/utils/get-animation-props";
import React from "react";

type TFourthSection = {};

const ChartData = [
  {
    id: "1",
    title: "3468 USDT",
    caption: "상위 5%",
    chartHeight: "full",
    type: "HIGH",
  },
  {
    id: "2",
    title: "934 USDT",
    caption: "5-20%",
    chartHeight: "20",
    type: "HIGH",
  },
  {
    id: "3",
    title: "229 USDT",
    caption: "25-50%",
    chartHeight: "6",
    type: "HIGH",
  },
  {
    id: "4",
    title: "64 USDT",
    caption: "50-75%",
    chartHeight: "4",
    type: "MUTED",
  },
  {
    id: "5",
    title: "15 USDT",
    caption: "75-100%",
    chartHeight: "2",
    type: "MUTED",
  },
  {
    id: "6",
    title: "370 USDT",
    caption: "전체평균",
    chartHeight: "12",
    type: "MUTED",
  },
];

const FourthSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TFourthSection
>((props, ref) => {
  return (
    <section
      ref={ref}
      {...props}
      className="py-16 max-md:py-10 max-md:pb-0 px-4"
    >
      <div className="flex max-md:flex-col max-md:items-start items-center justify-between md:pb-16">
        <div className="text-foreground shrink-0">
          <p
            className="text-4xl max-md:text-xl font-bold pb-5 max-md:pb-2"
            {...getAnimationProps("right", 500, 0)}
          >
            매일 평균 페이백, <br />
            30 USDT부터 6,800 USDT 까지
          </p>
          <p
            className="text-lg max-md:text-xs font-normal max-md:text-muted-foreground"
            {...getAnimationProps("right", 500, 200)}
          >
            하루 거래 2회 이상,
            <br className="md:hidden" /> 시드 100 USDT+a 경우 50 USDT + a <br />
            페이백 거래량 상위 11%라면,
            <br className="md:hidden" /> 1,800 USDT+a 의 페이백을 매일받고
            있어요.
          </p>
        </div>
        <div className="flex justify-between self-center my-8 h-[224px] md:h-[316px]">
          {ChartData.map((item, idx) => (
            <div
              key={item.id}
              {...getAnimationProps("fade", 500, idx * 100 + 200)}
            >
              <Chart item={item} />
            </div>
          ))}
        </div>
      </div>
      <div
        className="bg-muted rounded-xl p-4"
        {...getAnimationProps("up", 500, 0)}
      >
        <span className="text-base max-md:text-xs font-medium text-muted-foreground">
          전체 고객에 대한 통계 그래프는 위와 같으며,
          <br className="md:hidden" /> 100 USDT 미만의 소액시드나 휴면유저의
          <br className="md:hidden" /> 데이터까지 합산된 통계에요. <br />{" "}
          일반적으로 선물 거래 매매를 진행하시는 고객님들의 경우,{" "}
          <br className="md:hidden" />
          <p className="text-foreground inline-block">
            상위 50%의 초과한 영역에 해당돼요.
          </p>
        </span>
      </div>
    </section>
  );
});

FourthSection.displayName = "FourthSection";

export { FourthSection };
