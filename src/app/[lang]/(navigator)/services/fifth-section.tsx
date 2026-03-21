"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAnimationProps } from "@/lib/utils/get-animation-props";
import React, { useEffect, useState } from "react";

type TFifthSection = {};

const ExchangeAvatarIcons = [
  { id: "1", imagePath: "/icons/services-icons/exchange-1.png" },
  { id: "2", imagePath: "/icons/services-icons/exchange-2.png" },
  { id: "3", imagePath: "/icons/services-icons/exchange-3.png" },
  { id: "4", imagePath: "/icons/services-icons/exchange-4.png" },
  { id: "5", imagePath: "/icons/services-icons/exchange-5.png" },
  { id: "6", imagePath: "/icons/services-icons/exchange-6.png" },
];

const FifthSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TFifthSection
>((props, ref) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ExchangeAvatarIcons.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);
  return (
    <section
      ref={ref}
      {...props}
      className="bg-muted max-md:bg-border md:rounded-xl py-16 max-md:py-10"
      {...getAnimationProps("fade", 500, 0)}
    >
      <div className="text-center pb-16 max-md:pb-10">
        <span
          className="text-4xl max-md:text-xl font-bold text-foreground"
          {...getAnimationProps("fade", 500, 0)}
        >
          <p className="inline-block text-foreground">크립토엑스</p>를{" "}
          <br className="max-md:hidden" />
          통해
          <br className="md:hidden" /> 매일 거래수수료를 돌려받아요
        </span>
      </div>
      <div className="flex justify-center items-center">
        {ExchangeAvatarIcons.map((icon, idx) => (
          <div
            key={icon.id}
            data-active={currentIndex === idx}
            className="mx-2 flex items-center justify-center transition-all rounded-full w-[104px] h-[104px] max-md:w-[42px] max-md:h-[42px] bg-background border-2 border-background data-[active=true]:border-foreground "
            {...getAnimationProps("up", 500, idx * 100 + 200)}
          >
            <Avatar className="w-[88px] h-[88px] max-md:w-[35px] max-md:h-[35px] data-[active=true]:scale-150 scale-100">
              <AvatarImage src={icon.imagePath} />
              <AvatarFallback>{"exchange icon"}</AvatarFallback>
            </Avatar>
          </div>
        ))}
      </div>
    </section>
  );
});

FifthSection.displayName = "FifthSection";

export { FifthSection };
