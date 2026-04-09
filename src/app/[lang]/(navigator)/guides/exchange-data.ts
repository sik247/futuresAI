export type ExchangeGuide = {
  slug: string;
  name: string;
  nameKo: string;
  paybackPercent: number;
  referralCode: string;
  referralLink: string;
  maxAccounts: number;
  color: string;
  logoText: string;
  canChangeReferral: boolean;
  referralChangeNote?: string;
  referralChangeNoteKo?: string;
};

export const EXCHANGE_GUIDES: ExchangeGuide[] = [
  {
    slug: "bitget",
    name: "Bitget",
    nameKo: "비트겟",
    paybackPercent: 55,
    referralCode: "FuturesAI",
    referralLink: "https://partner.bitget.com/bg/FuturesAI",
    maxAccounts: 3,
    color: "#00D4AA",
    logoText: "Bitget",
    canChangeReferral: false,
  },
  {
    slug: "bybit",
    name: "Bybit",
    nameKo: "바이비트",
    paybackPercent: 20,
    referralCode: "FUTURESAI",
    referralLink: "https://partner.bybit.com/b/FUTURESAI",
    maxAccounts: 3,
    color: "#F7A600",
    logoText: "Bybit",
    canChangeReferral: true,
    referralChangeNote:
      "Can change referral code within 14 days of signup by contacting support@bybit.com",
    referralChangeNoteKo:
      "신규 가입 후 14일 이내에 support@bybit.com으로 문의하면 레퍼럴 코드 변경 가능",
  },
  {
    slug: "okx",
    name: "OKX",
    nameKo: "OKX(오케이엑스)",
    paybackPercent: 20,
    referralCode: "futuresai",
    referralLink: "https://www.okx.com/join/futuresai",
    maxAccounts: 3,
    color: "#FFFFFF",
    logoText: "OKX",
    canChangeReferral: true,
    referralChangeNote:
      "Referral change possible if: 90+ days since signup with <1M USDT volume, or within 7 days, or 31-90 days with <100K USDT volume",
    referralChangeNoteKo:
      "가입 90일 초과 + 거래량 100만 USDT 이하, 가입 7일 이내, 또는 가입 31~90일 + 거래량 10만 USDT 이하인 경우 변경 가능",
  },
  {
    slug: "gate",
    name: "Gate.io",
    nameKo: "게이트",
    paybackPercent: 75,
    referralCode: "RKCBNQNR",
    referralLink: "https://www.gate.com/share/FuturesAI",
    maxAccounts: 3,
    color: "#2354E6",
    logoText: "Gate.io",
    canChangeReferral: false,
  },
  {
    slug: "bingx",
    name: "BingX",
    nameKo: "빙엑스",
    paybackPercent: 50,
    referralCode: "FCC9QDJK",
    referralLink: "https://bingx.com/en/invite/FCC9QDJK",
    maxAccounts: 3,
    color: "#2B6DEA",
    logoText: "BingX",
    canChangeReferral: false,
  },
  {
    slug: "htx",
    name: "HTX",
    nameKo: "HTX(구 후오비)",
    paybackPercent: 54,
    referralCode: "miqkc223",
    referralLink:
      "https://www.htx.com.gt/invite-register?inviter_id=11343840&invite_code=miqkc223",
    maxAccounts: 3,
    color: "#2BAF68",
    logoText: "HTX",
    canChangeReferral: false,
  },
];
