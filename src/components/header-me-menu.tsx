"use client";

import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { UserIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

const HeaderMeMenu = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const signOutHandler = () => {
    signOut({ redirect: true });
    alert("로그아웃 되었습니다.");
  };
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="border bg-muted">
            <div className="flex items-center gap-2 font-bold text-muted-foreground">
              <UserIcon className="w-4 h-4 text-foreground" />
              {session?.user.name}
            </div>
          </NavigationMenuTrigger>
          <NavigationMenuContent className="px-6 py-4 rounded-2xl bg-background w-32">
            <div className="w-[240px] flex flex-col">
              <p className="text-base font-semibold text-foreground p-2">
                {session?.user.email}
              </p>
              <Link
                href={"/me/edit"}
                className="flex items-center justify-between hover:bg-muted p-2 rounded-lg"
              >
                <p className="text-base font-semibold text-foreground">
                  정보수정
                </p>
                <ChevronRight className="w-4 h-4 text-foreground" />
              </Link>
              {/* //로그아웃 */}
              <Button
                variant={"secondary"}
                onClick={signOutHandler}
                className="w-full justify-between text-base font-semibold text-foreground bg-background  hover:bg-muted p-2"
              >
                로그아웃
                <ChevronRight className="w-4 h-4 text-foreground" />
              </Button>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default HeaderMeMenu;
