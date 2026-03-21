import Container from "@/components/ui/container";
import React from "react";
import { getUser } from "./actions";
import { ProfileInfoSection } from "./profile-info-section";
import { ProfileTabs } from "./profile-tabs";

type TProfile = {};

const Profile: React.FC<TProfile> = async ({}) => {
  const [user] = await Promise.all([getUser()]);
  if (!user) {
    return;
  }

  if (!user) {
    return;
  }
  return (
    <Container className="flex flex-col gap-6 py-12 max-md:px-4 px-6">
      <ProfileInfoSection user={user} />
      <ProfileTabs user={user} />
    </Container>
  );
};

export default Profile;
