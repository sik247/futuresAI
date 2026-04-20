export type TrxProductKey = "CHART_SINGLE" | "CHAT_PACK_10" | "TRX_REFILL";

export interface TrxProduct {
  key: TrxProductKey;
  trx: number;
  chartCredits: number;
  chatCredits: number;
  labelEn: string;
  labelKo: string;
}

export const TRX_PRODUCTS: Record<TrxProductKey, TrxProduct> = {
  CHART_SINGLE: {
    key: "CHART_SINGLE",
    trx: 3,
    chartCredits: 1,
    chatCredits: 0,
    labelEn: "Single chart reading",
    labelKo: "차트 분석 1회",
  },
  CHAT_PACK_10: {
    key: "CHAT_PACK_10",
    trx: 5,
    chartCredits: 0,
    chatCredits: 10,
    labelEn: "10 AI chat messages",
    labelKo: "AI 채팅 10회",
  },
  TRX_REFILL: {
    key: "TRX_REFILL",
    trx: 0,
    chartCredits: 0,
    chatCredits: 0,
    labelEn: "Refill TRX wallet",
    labelKo: "TRX 지갑 충전",
  },
};

export const TRX_REFILL_MIN = 20;
export const TRX_REFILL_MAX = 5000;

export function resolveProduct(key: string): TrxProduct | null {
  if (key in TRX_PRODUCTS) return TRX_PRODUCTS[key as TrxProductKey];
  return null;
}
