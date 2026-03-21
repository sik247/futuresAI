"use client";

import Loading from "@/components/ui/loading";
import { useAlertDialog } from "@/components/ui/use-alert-dialog";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type TReward = {};

const Reward: React.FC<TReward> = ({}) => {
  const router = useRouter();
  const { open } = useAlertDialog({
    title: "준비중입니다.",
    description:
      "현재 리워드 페이지는 준비중입니다. 추후 추가될 예정이니 기대해주세요.",
    onCancel: () => {
      router.back();
    },
    onConfirm: () => {
      router.back();
    },
  });
  useEffect(() => {
    setTimeout(() => {
      open();
    }, 500);
  }, []);
  return <Loading />;
};

export default Reward;
