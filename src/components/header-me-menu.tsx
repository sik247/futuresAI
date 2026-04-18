"use client";

import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { signOut, useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LogOut, User as UserIcon } from "lucide-react";
import { toast } from "./ui/use-toast";

function getInitial(name?: string | null, email?: string | null) {
  const source = (name || email || "").trim();
  if (!source) return "U";
  const ch = source[0];
  return ch ? ch.toUpperCase() : "U";
}

const HeaderMeMenu = () => {
  const { data: session } = useSession();
  const params = useParams<{ lang?: string }>();
  const ko = params?.lang !== "en";

  const signOutHandler = async () => {
    await signOut({ redirect: true });
    toast({
      title: ko ? "로그아웃" : "Signed out",
      description: ko ? "안전하게 로그아웃되었습니다." : "You have been signed out.",
    });
  };

  const initial = getInitial(session?.user?.name, session?.user?.email);
  const displayName = session?.user?.name || session?.user?.email || (ko ? "회원" : "Member");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={ko ? "내 계정" : "My account"}
          className="h-8 w-8 rounded-full flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 text-[12px] font-bold text-zinc-100 transition-colors"
        >
          {initial}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-60 p-2 rounded-2xl bg-zinc-950 border border-white/[0.08] shadow-xl"
      >
        <div className="px-3 py-2.5 border-b border-white/[0.06]">
          <p className="text-[13px] font-semibold text-zinc-100 truncate">{displayName}</p>
          {session?.user?.email && session.user.email !== displayName && (
            <p className="text-[11px] text-zinc-500 truncate mt-0.5">{session.user.email}</p>
          )}
        </div>
        <div className="py-1">
          <Link
            href="/me/edit"
            className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] text-[13px] font-medium text-zinc-200"
          >
            <span className="inline-flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              {ko ? "정보 수정" : "Edit profile"}
            </span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </Link>
          <button
            onClick={signOutHandler}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg hover:bg-red-500/[0.08] text-[13px] font-medium text-red-400"
          >
            <span className="inline-flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              {ko ? "로그아웃" : "Sign out"}
            </span>
            <ChevronRight className="w-4 h-4 text-red-400/70" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default HeaderMeMenu;
