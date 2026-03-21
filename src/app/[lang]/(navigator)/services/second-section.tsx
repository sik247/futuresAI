import { getAnimationProps } from "@/lib/utils/get-animation-props";
import Image from "next/image";
import React from "react";

type TSecondSection = {};

const ElementData = [
  {
    id: "1",
    imagePath: "/icons/services-icons/cards.png",
    title: "안전하고 영구적 페이백 서비스",
    description: "거래소 공식 협업",
  },
  {
    id: "2",
    imagePath: "/icons/services-icons/border-circle.png",
    title: "투명하고 높은 페이백 요율",
    description: "최대 97% 페이백 제공",
  },
  {
    id: "3",
    imagePath: "/icons/services-icons/wallet.png",
    title: "수많은 트레이더들의 선택",
    description: "+15,000 명",
  },
];

const SecondSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TSecondSection
>((props, ref) => {
  return (
    <section
      ref={ref}
      {...props}
      className="grid grid-cols-1 gap-16 max-md:gap-10 text-center bg-muted md:rounded-xl py-12"
      {...getAnimationProps("fade", 500, 0)}
    >
      <div className="grid grid-cols-1 gap-4 max-md:gap-2 text-center">
        <p
          className="text-2xl max-md:text-sm max-md:font-semibold font-medium text-foreground"
          {...getAnimationProps("fade", 500, 0)}
        >
          크립토엑스
        </p>
        <p
          className="text-4xl max-md:text-xl font-bold text-foreground"
          {...getAnimationProps("fade", 500, 200)}
        >
          크립토엑스를 사용해야하는 이유
        </p>
        <p
          className="text-lg font-normal max-md:text-xs max-md:font-medium text-foreground"
          {...getAnimationProps("fade", 500, 300)}
        >
          크립토엑스는 다릅니다.
        </p>
      </div>
      <div className="flex max-md:flex-col max-md:gap-10 justify-evenly items-center">
        {ElementData.map((element, idx) => (
          <div
            key={element.id}
            className="flex flex-col justify-center items-center"
          >
            <Image
              src={element.imagePath}
              alt="service element"
              width={70}
              height={70}
              className="mb-10 max-md:mb-6"
              {...getAnimationProps("up", 500, idx * 100 + 200)}
            />
            <div className="text-center text-foreground">
              <p
                className="text-base max-md:text-sm font-medium"
                {...getAnimationProps("up", 500, idx * 100 + 200)}
              >
                {element.title}
              </p>
              <p
                className="font-bold text-2xl max-md:text-xl text-bold"
                {...getAnimationProps("up", 500, idx * 100 + 200)}
              >
                {element.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

SecondSection.displayName = "SecondSection";

export { SecondSection };
