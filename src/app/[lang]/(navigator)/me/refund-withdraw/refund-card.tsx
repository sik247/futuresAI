"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { withdrawStore } from "@/lib/stores/withdraw-store";
import Image from "next/image";
import React from "react";
import { useStore } from "zustand";

type TRefundCard = {
  element: RefundType;
};

const RefundCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TRefundCard
>((props, ref) => {
  const {
    tradeIds,
    setTradeIds,
    amount,
    setAmount,
    exchangeAccountIds,
    setExchangeAccountIds,
  } = useStore(withdrawStore);
  return (
    <>
      <div className="flex justify-between items-center py-3 w-full">
        <div className="flex justify-start items-center flex-shrink min-w-0">
          <Checkbox
            className="mr-2 flex-shrink-0 border border-muted-foreground"
            disabled={
              props.element.status !== "ACTIVE" || props.element.amount === 0
            }
            onClick={() => {
              if (tradeIds.includes(props.element.id)) {
                setTradeIds(
                  tradeIds.filter((id) =>
                    props.element.tradeIds.some((tradeId) => tradeId === id)
                  )
                );
                setAmount(amount - props.element.amount);
                setExchangeAccountIds(
                  exchangeAccountIds.filter(
                    (id) => id !== props.element.exchangeAccountId
                  )
                );
              } else {
                setTradeIds([...tradeIds, ...props.element.tradeIds]);
                setAmount(amount + props.element.amount);
                setExchangeAccountIds([
                  ...exchangeAccountIds,
                  props.element.exchangeAccountId,
                ]);
              }
            }}
          />
          <Image
            src={"/icons/me-money-hands.png"}
            alt="money-hands"
            width={36}
            height={36}
            className="flex-shrink-0"
          />
          <div className="flex flex-col justify-between items-start px-2 min-w-0 flex-grow">
            <p className="text-base font-medium text-foreground whitespace-nowrap">
              {props.element.exchangeName}
            </p>
            <p className="text-sm w-full font-normal text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
              uid: {props.element.uid}
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center gap-2 flex-shrink-0">
          <p className="text-sm font-semibold text-foreground whitespace-nowrap">
            {props.element.amount.toLocaleString()} USDT
          </p>

          <div
            className={`rounded-full px-2 py-0.5 ${
              props.element.status === "PENDING"
                ? "bg-muted-foreground"
                : props.element.status === "ACTIVE"
                ? "bg-foreground"
                : "bg-muted"
            }`}
          >
            <p
              className={`text-xs font-semibold ${
                props.element.status === "INACTIVE"
                  ? "text-muted-foreground"
                  : "text-background"
              }`}
            >
              {props.element.status === "PENDING"
                ? "대기"
                : props.element.status === "ACTIVE"
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

RefundCard.displayName = "RefundCard";

export { RefundCard };
