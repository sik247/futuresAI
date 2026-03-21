import { User } from "@prisma/client";
import Image from "next/image";
import React from "react";

type TFollowCard = {
  userImageUrl: string;
  userName: string;
};

const FollowCard: React.FC<TFollowCard> = ({ userImageUrl, userName }) => {
  return (
    <div className="flex p-6 bg-muted rounded-md items-center gap-3">
      <Image
        src={userImageUrl}
        alt="profile"
        width={48}
        height={48}
        className=" rounded-sm w-12 h-12 object-cover"
      />
      <p className="font-bold text-base text-foreground">{userName}</p>
    </div>
  );
};

export default FollowCard;
