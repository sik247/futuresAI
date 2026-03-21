"use client";
import { getAnimationProps } from "@/lib/utils/get-animation-props";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface TCategorySelectSection {
  selectedCategory?: string;
}

const CategorySelectSection = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & TCategorySelectSection
>(({ selectedCategory, ...props }, ref) => {
  const pathname = usePathname();

  function getRoute(category: string) {
    const newSearchParams = new URLSearchParams(pathname.split("?")[1]);
    newSearchParams.set("category", category);
    const newPathname = `${pathname}?${newSearchParams.toString()}`;
    return newPathname;
  }

  return (
    <div
      {...getAnimationProps("up", 500, 0)}
      ref={ref}
      {...props}
      className="flex gap-2 items-center"
    >
      <div className="flex gap-2">
        <RouteMenu
          title="전체"
          route="posts"
          type={undefined}
          category={selectedCategory}
        />
        <RouteMenu
          title="롱"
          route={getRoute("long")}
          type="long"
          category={selectedCategory}
        />
        <RouteMenu
          title="숏"
          route={getRoute("shorts")}
          type="shorts"
          category={selectedCategory}
        />
      </div>
    </div>
  );
});

CategorySelectSection.displayName = "CategorySelectSection";
export { CategorySelectSection };

const RouteMenu: React.FC<{
  title: string;
  route: string;
  type: string | undefined;
  category?: string;
}> = ({ title, route, type, category }) => {
  function getBackgroundColor() {
    if (category === type) {
      return "bg-slate-100";
    } else {
      return;
    }
  }

  return (
    <Link
      href={route}
      className={
        "flex items-center gap-1 px-4 py-2 w-max rounded-md max-md:px-2 max-md:py-1 " +
        getBackgroundColor()
      }
    >
      <span className=" text-sm font-bold max-md:text-xs">{title}</span>

      <ChevronDownIcon
        className={`
        w-3 h-3
        transform
        transition-transform
        duration-300
        ease-in-out
        ${category === type ? "rotate-180" : "rotate-0"}
      `}
      />
    </Link>
  );
};
