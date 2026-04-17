"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import React from "react";

const MeMenuSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname.split("/")[1] || "en";
  const ko = lang === "ko";

  const signOutHandler = () => {
    signOut({ redirect: true });
  };

  const items: {
    label: string;
    onClick: () => void;
    mobileOnly?: boolean;
    variant?: "default" | "danger";
  }[] = [
    {
      label: ko ? "정보 수정" : "Edit Profile",
      onClick: () => router.push(`/${lang}/me/edit`),
    },
    {
      label: ko ? "출금 및 환급 내역" : "Withdrawals & Refunds",
      onClick: () => router.push(`/${lang}/me/refund-withdraw`),
      mobileOnly: true,
    },
    {
      label: ko ? "프로필 관리" : "Profile Management",
      onClick: () => router.push(`/${lang}/me/profile`),
      mobileOnly: true,
    },
    {
      label: ko ? "로그아웃" : "Sign Out",
      onClick: signOutHandler,
      variant: "danger",
    },
  ];

  return (
    <section ref={ref} {...props} className="py-4">
      <div className="flex flex-col gap-1.5 rounded-2xl overflow-hidden border border-border bg-card">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            className={`group w-full flex items-center justify-between gap-3 min-h-[52px] px-4 text-[15px] font-medium text-left transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
              item.variant === "danger"
                ? "text-red-500 hover:bg-red-500/[0.04]"
                : "text-foreground hover:bg-muted/40"
            } ${item.mobileOnly ? "md:hidden" : ""} ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <span>{item.label}</span>
            <ChevronRightIcon
              className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 ${
                item.variant === "danger" ? "text-red-500/60" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
});

MeMenuSection.displayName = "MeMenuSection";

export { MeMenuSection };
