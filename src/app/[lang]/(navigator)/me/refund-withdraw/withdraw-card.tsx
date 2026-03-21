import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import React from "react";

type TWithdrawCard = {
  element: WithdrawType;
};

const WithdrawCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TWithdrawCard
>((props, ref) => {
  return (
    <>
      <div className="flex justify-between items-center py-3">
        <div className="flex justify-start items-center">
          <Image
            src={"/icons/me-money-hands.png"}
            alt="money-hands"
            width={36}
            height={36}
          />

          <div className="flex flex-col justify-between items-start px-2">
            <p className="text-base font-medium text-foreground">
              {props.element.exchangeName}
            </p>
            <p className="text-sm font-normal text-muted-foreground">
              {props.element.uid}
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center gap-2">
          <p className="text-sm font-semibold text-primary-foreground">
            {props.element.amount} USDT
          </p>

          <div
            className={`rounded-full px-2 py-0.5 ${
              props.element.status === "PENDING"
                ? "bg-muted-foreground"
                : props.element.status === "SUCCESS"
                ? "bg-primary-foreground"
                : "bg-muted"
            }`}
          >
            <p
              className={`text-xs font-semibold ${
                props.element.status === "FAILED"
                  ? "text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {props.element.status === "PENDING"
                ? "대기"
                : props.element.status === "SUCCESS"
                ? "성공"
                : "실패"}
            </p>
          </div>
        </div>
      </div>
      <Separator />
    </>
  );
});

WithdrawCard.displayName = "WithdrawCard";

export { WithdrawCard };
