import { User } from "@prisma/client";
import React from "react";
import FollowCard from "./follow-card";

interface TFollowingsSection {
  users: User[];
}

const FollowingsSection = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & TFollowingsSection
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

FollowingsSection.displayName = "FollowingsSection";
export { FollowingsSection };
