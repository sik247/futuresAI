"use client";
import PostCard from "@/components/post-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Prisma } from "@prisma/client";
import React from "react";
import { deletePost } from "./actions";
import { revalidateAll } from "@/lib/services/revalidate";
import { Switch } from "@/components/ui/switch";
import TabsTriggerSection from "./tabs-trigger-section";

interface TProfilePostListSection {
  posts: Prisma.PostGetPayload<{
    include: {
      user: true;
      comments: true;
      likes: true;
    };
  }>[];
}

const ProfilePostListSection = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & TProfilePostListSection
>(({ posts, ...props }, ref) => {
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [selectedPostId, setSelectedPostId] = React.useState<string | null>(
    null
  );

  return (
    <div ref={ref} {...props} className="flex flex-col gap-3  -mt-6">
      <Dialog open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정말 삭제하시겠습니까?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={async () => {
                if (selectedPostId) {
                  await deletePost(selectedPostId);
                  revalidateAll("/me/profile");
                  setIsEditMode(false);
                }
                setOpen(false);
              }}
              className="bg-foreground text-background"
            >
              삭제하기
            </Button>
            <Button
              variant={"outline"}
              onClick={() => {
                setOpen(false);
              }}
            >
              취소
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <TabsTriggerSection />
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            편집모드
          </span>
          <Switch
            checked={isEditMode}
            onCheckedChange={() => setIsEditMode(!isEditMode)}
          />
        </div>
      </div>

      <div className="md:grid md:grid-cols-3 gap-3 max-md:inline-flex max-md:overflow-x-auto">
        {posts.map((post, index) => (
          <PostCard
            id={post.id}
            key={index}
            index={index}
            title={post.title}
            content={post.content}
            imageUrl={post.imageUrl}
            profileImageUrl={post.user.imageUrl || "/images/profile.png"}
            profileName={post.user.nickname}
            userId={post.user.id}
            createdAt={post.createdAt}
            commentCount={post.comments.length}
            likeCount={post.likes.length}
            isLiked={false}
            isFollowing={false}
            isEditMode={isEditMode}
            onDelete={() => {
              setOpen(true);
              setSelectedPostId(post.id);
            }}
          />
        ))}
      </div>
    </div>
  );
});

ProfilePostListSection.displayName = "ProfilePostListSection";
export { ProfilePostListSection };
