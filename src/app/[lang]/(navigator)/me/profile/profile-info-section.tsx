import { User } from "@prisma/client";
import Image from "next/image";
import React from "react";

interface TProfileInfoSection {
  user: User;
}

const ProfileInfoSection = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & TProfileInfoSection
>(({ user, ...props }, ref) => {
  return (
    <div ref={ref} {...props} className="flex w-full items-center">
      <div className="flex items-center gap-6">
        <Image
          src={user.imageUrl || "/images/profile.png"}
          alt="profile"
          width={132}
          height={132}
          className=" rounded-sm max-md:w-12 max-md:h-12"
        />
        <p className="font-bold text-4xl max-md:text-2xl">{user.name}</p>
      </div>
    </div>
  );
});

ProfileInfoSection.displayName = "ProfileInfoSection";
export { ProfileInfoSection };
