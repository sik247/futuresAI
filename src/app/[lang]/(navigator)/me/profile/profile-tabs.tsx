"use client";

import React, { useState } from "react";

import TabsTriggerSection from "./tabs-trigger-section";
import { FollowersSection } from "./followers-section";
import { FollowingsSection } from "./followings-section";
import { ProfilePostListSection } from "./profile-post-list-section";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Prisma } from "@prisma/client";

const ProfileTabs = ({
  user,
}: {
  user: Prisma.UserGetPayload<{
    include: {
      posts: {
        include: {
          user: true;
          comments: true;
          likes: true;
        };
      };
      followers: true;
      followings: true;
    };
  }>;
}) => {
  const [value, setValue] = useState("posts");
  return (
    <Tabs
      defaultValue="posts"
      onValueChange={(value) => {
        setValue(value);
      }}
    >
      {value !== "posts" && <TabsTriggerSection />}
      <TabsContent value="posts">
        <ProfilePostListSection posts={user.posts} />
      </TabsContent>
      <TabsContent value="followers">
        <FollowersSection users={user.followers} />
      </TabsContent>
      <TabsContent value="followings">
        <FollowingsSection users={user.followings} />
      </TabsContent>
    </Tabs>
  );
};

export { ProfileTabs };
