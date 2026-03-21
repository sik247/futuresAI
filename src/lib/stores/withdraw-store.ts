"use client";

import { create } from "zustand";

interface WithdrawStore {
  amount: number;
  setAmount: (amount: number) => void;
  tradeIds: string[];
  setTradeIds: (tradeIds: string[]) => void;
  exchangeAccountIds: string[];
  setExchangeAccountIds: (exchangeAccountIds: string[]) => void;
}

export const withdrawStore = create<WithdrawStore>((set) => {
  return {
    amount: 0,
    setAmount: (amount: number) => set({ amount }),
    tradeIds: [],
    setTradeIds: (tradeIds: string[]) => set({ tradeIds }),
    exchangeAccountIds: [],
    setExchangeAccountIds: (exchangeAccountIds: string[]) =>
      set({ exchangeAccountIds }),
  };
});
