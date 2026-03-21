import Container from "@/components/ui/container";
import React from "react";
import { RefundList } from "./refund-list";
import { WithdrawList } from "./withdraw-list";
import { WithdrawalApplicationModal } from "./withdrawal-application-modal";
import { AddExchangeModal } from "./add-exchange-modal";
import { getExchangeAccounts, getExchanges, getWithdrawals } from "./actions";

type RefundProps = {};

const RefundPage: React.FC<RefundProps> = async ({}) => {
  const [exchanges, exchangeAccounts, withdrawals] = await Promise.all([
    getExchanges(),
    getExchangeAccounts(),
    getWithdrawals(),
  ]);
  console.log(exchangeAccounts);
  return (
    <div className="bg-muted">
      <Container className="px-6 pt-10 md:bg-background">
        <div>
          <h1 className="text-3xl font-bold py-6">환급 내역</h1>
          <RefundList
            data={exchangeAccounts.map((account) => ({
              id: account.id,
              exchangeName: account.exchange.name,
              uid: account.uid,
              exchangeAccountId: account.id,
              amount: account.trades.reduce(
                (acc, trade) => acc + trade.payback,
                0
              ),

              status: account.status,
              tradeIds: account.trades.map((trade) => {
                return trade.id;
              }),
            }))}
          />
          <div className="flex justify-center items-center gap-4 py-6">
            <AddExchangeModal exchanges={exchanges} />
            <WithdrawalApplicationModal />
          </div>
        </div>
        <div className="pb-10">
          <h1 className="text-3xl font-bold py-6">출금 내역</h1>
          <WithdrawList
            data={withdrawals.map((withdrawal) => ({
              id: withdrawal.id,
              exchangeName: "출금 신청",
              uid: withdrawal.createdAt.toLocaleDateString(),
              amount: withdrawal.amount,
              status: withdrawal.status,
            }))}
          />
        </div>
      </Container>
    </div>
  );
};

export default RefundPage;
