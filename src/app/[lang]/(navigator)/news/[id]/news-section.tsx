"use client";

import { Button } from "@/components/ui/button";
import { News } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

interface TNewsSection {
  news: News;
}

const NewsSection = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & TNewsSection
>(({ news, ...props }, ref) => {
  const router = useRouter();

  return (
    <div
      ref={ref}
      {...props}
      className="flex flex-col gap-12 py-16 w-full  max-md:pb-8"
    >
      <div className="flex flex-col gap-12 max-md:gap-8">
        <button
          onClick={() => {
            router.back();
          }}
        >
          <ArrowLeft size={28} />
        </button>
        <div className="flex justify-between ">
          <div className="flex flex-col gap-4 max-md:gap-2">
            <p className="text-4xl max-md:text-2xl text-foreground font-bold">
              {news.title}
            </p>
            <p className="text-md max-md:text-sm text-muted-foreground">
              {news.createdAt.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <p className="text-xl max-md:text-sm  text-foreground">
            {news.content}
          </p>
        </div>
      </div>
    </div>
  );
});

NewsSection.displayName = "NewsSection";
export { NewsSection };
