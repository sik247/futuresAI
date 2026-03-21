import { getAnimationProps } from "@/lib/utils/get-animation-props";
import Image from "next/image";
import React from "react";

type TEventBannerSection = {};

const EventBannerSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TEventBannerSection
>((props, ref) => {
  return (
    <section
      ref={ref}
      {...props}
      className="flex justify-between items-start rounded-3xl p-6 bg-muted max-md:mx-5 "
      {...getAnimationProps("fade", 500, 0)}
    >
      <div {...getAnimationProps("left", 500, 0)}>
        <p className="text-xl text-primary-foreground max-md:text-xl font-bold mb-1">
          이벤트 배너
        </p>
        <p className="text-muted-foreground text-base max-md:text-sm font-medium max-md:font-semibold">
          이벤트 내용을 적어주세요.
        </p>
      </div>
      <Image
        src={"/images/event-sample.png"}
        alt="event-banner"
        width={144}
        height={144}
        className="max-md:w-20 h-20 object-contain"
        {...getAnimationProps("right", 500, 0)}
      />
    </section>
  );
});

EventBannerSection.displayName = "EventBannerSection";

export { EventBannerSection };
