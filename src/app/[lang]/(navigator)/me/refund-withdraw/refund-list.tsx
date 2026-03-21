import Container from "@/components/ui/container";
import React from "react";
import { RefundCard } from "./refund-card";

type TRefundList = {
  data: RefundType[];
};

const RefundList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TRefundList
>((props, ref) => {
  return (
    <Container className="rounded-xl bg-background p-6">
      {props.data.length > 0 ? (
        props.data.map((element) => (
          <RefundCard key={element.id} element={element} />
        ))
      ) : (
        <span className="w-full text-sm text-muted-foreground text-center">
          환급 내역이 없습니다.
        </span>
      )}
    </Container>
  );
});

RefundList.displayName = "RefundList";

export { RefundList };
