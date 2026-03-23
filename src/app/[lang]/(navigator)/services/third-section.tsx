import { getAnimationProps } from "@/lib/utils/get-animation-props";
import Image from "next/image";
import React from "react";

type TThirdSection = {};

const GuideNavigation = [
  { id: "1", title: "Futures AI 코드로 거래소 가입하기" },
  { id: "2", title: "Futures AI에 UID 연결하기" },
  { id: "3", title: "트레이딩 마음껏 즐기기" },
  { id: "4", title: "페이백 환급받기!" },
];

const ThirdSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TThirdSection
>((props, ref) => {
  return (
    <section ref={ref} {...props} className="md:py-16 max-md:px-4">
      <div
        className="text-foreground pb-6"
        {...getAnimationProps("fade", 500, 0)}
      >
        <p className="text-4xl max-md:text-xl font-bold pb-5 max-md:pb-2">
          Futures AI 이용가이드
        </p>
        <p className="text-lg font-normal max-md:text-xs max-md:font-semibold max-md:text-muted-foreground">
          3분만 투자하면 평생 수수료를 환급받아요.
        </p>
      </div>
      <div
        className="grid md:grid-cols-2 gap-16"
        {...getAnimationProps("fade", 500, 200)}
      >
        <div className="max-md:hidden rounded-xl bg-muted flex justify-center items-center">
          <Image
            src={"/icons/services-icons/phone-mockup.png"}
            alt="phone-mockup"
            width={342}
            height={136}
          />
        </div>
        <div className="grid grid-cols-1 gap-10 max-md:gap-5">
          {GuideNavigation.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center"
              {...getAnimationProps("up", 500, idx * 100 + 100)}
            >
              <div className="flex justify-center items-center rounded-xl max-md:rounded-md w-16 h-16 max-md:w-8 max-md:h-8 bg-foreground text-2xl max-md:text-xl font-semibold text-background mr-8 max-md:mr-4">
                {item.id}
              </div>
              <p className="text-2xl max-md:text-base font-medium">
                {item.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

ThirdSection.displayName = "ThirdSection";

export { ThirdSection };
