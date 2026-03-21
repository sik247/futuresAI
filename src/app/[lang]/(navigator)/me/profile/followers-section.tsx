import { User } from "@prisma/client";
import React from "react";
import FollowCard from "./follow-card";

interface TFollowersSection {
  users: User[];
}

const FollowersSection = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & TFollowersSection
>(({ users, ...props }, ref) => {
  return (
    <div ref={ref} {...props} className="flex flex-col gap-3">
      {users.map((user, index) => (
        <FollowCard
          userImageUrl={user.imageUrl || "/images/profile.png"}
          userName={user.nickname}
          key={index}
        />
      ))}
    </div>
  );
});

FollowersSection.displayName = "FollowersSection";
export { FollowersSection };
