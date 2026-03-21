import Container from "@/components/ui/container";
import React from "react";
import { WithdrawCard } from "./withdraw-card";

type TWithdrawList = {
  data: WithdrawType[];
};

const WithdrawList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TWithdrawList
>((props, ref) => {
  return (
    <Container className="rounded-xl bg-background p-6">
      {props.data.length > 0 ? (
        props.data.map((element) => (
          <WithdrawCard key={element.id} element={element} />
        ))
      ) : (
        <span className="w-full text-sm text-muted-foreground text-center">
          출금 내역이 없습니다.
        </span>
      )}
    </Container>
  );
});

WithdrawList.displayName = "WithdrawList";

export { WithdrawList };
