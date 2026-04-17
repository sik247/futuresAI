"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import React from "react";

const MeHeaderSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const lang = pathname.split("/")[1] || "en";
  const ko = lang === "ko";

  const email = session?.user?.email;
  const name = session?.user?.name;
  const initials = (name || email || "U")
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section ref={ref} {...props} className="flex items-center gap-3 pt-20 lg:pt-6 pb-4">
      {/* Avatar */}
      <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold flex items-center justify-center shadow-lg">
        <span className="text-sm">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
          {ko ? "이메일" : "Email"}
        </p>
        <p className="text-sm font-semibold text-foreground truncate">
          {email ?? (ko ? "로그인 필요" : "Not signed in")}
        </p>
      </div>
    </section>
  );
});

MeHeaderSection.displayName = "MeHeaderSection";

export { MeHeaderSection };
