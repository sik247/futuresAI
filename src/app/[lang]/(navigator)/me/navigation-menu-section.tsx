"use client";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Coins, DollarSign, Home, List, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type TNavigationMenuSection = {};

const NavigationMenuSection: React.FC<TNavigationMenuSection> = ({}) => {
  const session = useSession();
  const currentPath = usePathname();
  const lang = currentPath.split("/")[1] || "en";

  type TMenu = {
    icon: React.ReactNode;
    title: string;
    link: string;
  };
  const menuList: TMenu[] = [
    {
      icon: <DollarSign size={16} />,
      title: "페이백",
      link: `/${lang}/me/refund-withdraw`,
    },
    {
      icon: <Users size={16} />,
      title: "커뮤니티",
      link: `/${lang}/me/profile`,
    },
    {
      icon: <Coins size={16} />,
      title: "리워드",
      link: `/${lang}/me/reward`,
    },
  ];

  return (
    <div className="w-full flex flex-col items-start gap-2 pt-4">
      <h1 className="font-semibold text-lg">My Page</h1>
      <div className="h-4"></div>
      {menuList.map((menu) => (
        <NavigationCard
          key={menu.title}
          title={menu.title}
          icon={menu.icon}
          link={menu.link}
        />
      ))}
    </div>
  );
};

const NavigationCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  link: string;
}> = ({ title, icon, link }) => {
  const path = usePathname();

  function getReactiveStyle(link: string) {
    if (path === link) {
      return " text-foreground font-semibold border-foreground";
    } else {
      return " text-muted-foreground";
    }
  }

  return (
    <Link
      href={link}
      className={cn(
        "px-4 py-2 flex items-center w-full gap-2 rounded cursor-pointer border",
        getReactiveStyle(link)
      )}
    >
      {icon}
      <span>{title}</span>
    </Link>
  );
};

export default NavigationMenuSection;
