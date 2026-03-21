import Container from "@/components/ui/container";
import React from "react";
import { MeDetailCard } from "./me-detail-card";

type TMeDetailList = {
  data: WithdrawType[] | RefundType[] | ConfirmWithdrawType[];
  type: "withdraw" | "confirm-withdraw" | "refund";
};

const MeDetailList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TMeDetailList
>((props, ref) => {
  return (
    <Container className="rounded-xl bg-background p-6">
      {props.data.map((element) => (
        <MeDetailCard
          state={element.status}
          key={element.id}
          element={element}
          type={props.type}
        />
      ))}
    </Container>
  );
});

MeDetailList.displayName = "MeDetailList";

export { MeDetailList };
