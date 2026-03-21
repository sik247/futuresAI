"use client";

import { SessionProvider } from "next-auth/react";
import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
}
function SessionProviders({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}

export default SessionProviders;
