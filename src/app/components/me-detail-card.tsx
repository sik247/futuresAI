import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import React from "react";

type TMeDetailCard = {
  element: ConfirmWithdrawType | WithdrawType | RefundType;
  type: "withdraw" | "confirm-withdraw" | "refund";
  state?: string;
};

const MeDetailCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TMeDetailCard
>((props, ref) => {
  return (
    <>
      <div className="flex justify-between items-center py-3">
        <div className="flex justify-start items-center">
          {props.type === "withdraw" ? (
            <Image src={"/icons/me-atm.png"} alt="atm" width={36} height={36} />
          ) : props.type === "refund" ? (
            <Image
              src={"/icons/me-money-hands.png"}
              alt="money-hands"
              width={36}
              height={36}
            />
          ) : (
            props.type === "confirm-withdraw" && (
              <Image
                src={"/icons/me-paper-bill.png"}
                alt="paper-bill"
                width={36}
                height={36}
              />
            )
          )}

          <div className="flex flex-col justify-between items-start px-2">
            <p className="text-base font-medium text-foreground">
              {props.element.exchangeName}
            </p>
            <p className="text-sm font-normal text-muted-foreground">
              uid: {props.element.uid}
            </p>
          </div>
        </div>

        {props.state && props.type === "confirm-withdraw" ? (
          <p className="text-sm font-semibold text-muted-foreground rounded-md bg-border px-2 py-1">
            {props.element.amount} USDT |{" "}
            {props.state === "pending" ? "대기" : "승인"}
          </p>
        ) : props.type === "withdraw" ? (
          <p className="text-sm font-semibold text-muted-foreground">
            -{props.element.amount} USDT
          </p>
        ) : props.type === "refund" ? (
          <p className="text-sm font-semibold text-primary-foreground">
            {props.element.amount} USDT
          </p>
        ) : null}
      </div>
      <Separator />
    </>
  );
});

MeDetailCard.displayName = "MeDetailCard";

export { MeDetailCard };
