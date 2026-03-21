"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

type TEnsureLogin = {};

const EnsureLogin: React.FC<TEnsureLogin> = ({}) => {
  // const router = useRouter();
  // const session = useSession();

  // useEffect(() => {
  //   if (!session?.data) {
  //     alert("로그인이 필요합니다.");
  //     router.push("/login");
  //   }
  // }, []);
  return <></>;
};

export default EnsureLogin;
