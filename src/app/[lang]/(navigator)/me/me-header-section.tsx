"use client";

import { useSession } from "next-auth/react";
import React from "react";

type TMeAvatarSection = {};

const MeHeaderSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TMeAvatarSection
>((props, ref) => {
  const { data: session } = useSession();

  return (
    <section
      ref={ref}
      {...props}
      className="flex justify-start items-center py-2 my-6"
    >
      <div className="text-base flex flex-col justify-center items-start px-4">
        <p className="text-base font-medium text-muted-foreground">이메일</p>
        <p className="font-semibold text-foreground">{session?.user?.email}</p>
      </div>
    </section>
  );
});

MeHeaderSection.displayName = "MeHeaderSection";

export { MeHeaderSection };
