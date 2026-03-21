import { getAnimationProps } from "@/lib/utils/get-animation-props";
import Image from "next/image";
import React from "react";

type TFirstSection = {};

const FirstSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TFirstSection
>((props, ref) => {
  return (
    <section
      ref={ref}
      {...props}
      className="flex justify-between items-center md:py-16 pt-10 max-md:px-4"
    >
      <div className="flex flex-col">
        <p
          className="text-2xl max-md:text-sm max-md:font-semibold font-medium pb-4"
          {...getAnimationProps("left", 500, 0)}
        >
          가장 안전하게 트레이딩을 시작하는 방법
        </p>
        <p
          className="text-4xl max-md:text-xl font-bold text-foreground"
          {...getAnimationProps("left", 500, 200)}
        >
          트레이더님의 업스윙을 위한 <br /> 필수 플랫폼
        </p>
      </div>
      <Image
        src={"/icons/services-icons/emoji-phone.png"}
        alt="emoji-phone"
        width={380}
        height={380}
        className="max-md:w-[113px] max-md:h-[94px]"
        {...getAnimationProps("right", 500, 200)}
      />
    </section>
  );
});

FirstSection.displayName = "FirstSection";

export { FirstSection };
