"use client";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
type TTabsTriggerSection = {};

const TabsTriggerSection: React.FC<TTabsTriggerSection> = ({}) => {
  return (
    <TabsList>
      <TabsTrigger value="posts">게시물</TabsTrigger>
      <TabsTrigger value="followers">팔로워</TabsTrigger>
      <TabsTrigger value="followings">팔로잉</TabsTrigger>
    </TabsList>
  );
};

export default TabsTriggerSection;
