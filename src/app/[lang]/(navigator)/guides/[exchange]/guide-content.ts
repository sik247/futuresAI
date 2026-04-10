type ContentBlock =
  | { type: "text"; content: string }
  | { type: "warning"; content: string }
  | { type: "info"; content: string }
  | { type: "image"; src: string; alt?: string; caption?: string }
  | {
      type: "images";
      images: { src: string; alt: string; caption?: string }[];
    }
  | { type: "list"; items: string[] }
  | { type: "code"; content: string }
  | { type: "link"; content: string; href: string };

type GuideSection = {
  title: string;
  blocks: ContentBlock[];
};

type GuideContent = {
  sections: GuideSection[];
};

const img = (exchange: string, name: string) =>
  `/guides/${exchange}/${name}`;

function getBitgetGuide(isKo: boolean): GuideContent {
  const e = "bitget";
  return {
    sections: [
      {
        title: isKo
          ? "레퍼럴 코드 & KYC 인증 변경 방법"
          : "Referral Code & KYC Change Method",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "비트겟은 한 명의 사용자가 최대 3개의 계정을 생성할 수 있는 정책을 가지고 있습니다. 여권, 운전면허증, 주민등록증을 각각 한 번씩 KYC 인증에 사용할 수 있습니다."
              : "Bitget allows each user to create up to 3 accounts. You can use a passport, driver's license, or national ID card for KYC verification, each one time.",
          },
          {
            type: "text",
            content: isKo
              ? "55% 페이백 혜택을 받기 위해 코드를 변경하는 절차는 다음과 같습니다."
              : "Follow these steps to change your code and receive the 55% payback benefit.",
          },
          {
            type: "list",
            items: isKo
              ? [
                  "계정 3개 모두 KYC 인증이 완료된 경우, 현재 계정을 삭제하고 KYC 인증을 취소합니다.",
                  "신규 가입: FuturesAI 전용 할인코드를 통해 새롭게 가입합니다.",
                ]
              : [
                  "If all 3 accounts have completed KYC, delete the current account to cancel KYC verification.",
                  "New signup: Register through the FuturesAI exclusive discount code.",
                ],
          },
        ],
      },
      {
        title: isKo
          ? "기존 계정 삭제하는 방법 (KYC 인증 취소)"
          : "How to Delete Existing Account (Cancel KYC)",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "비트겟 로그인 후 오른쪽 상단에 있는 아이콘 모양을 클릭하고, 영어로 된 사용자명을 클릭합니다."
              : "After logging into Bitget, click the icon in the top right corner, then click your username.",
          },
          { type: "image", src: img(e, "사진1.jpg"), alt: "Bitget profile menu" },
          {
            type: "text",
            content: isKo
              ? "프로필 페이지 하단으로 스크롤하여 'Close account' 버튼을 클릭합니다."
              : "Scroll down to the bottom of the profile page and click the 'Close account' button.",
          },
          {
            type: "image",
            src: img(e, "사진2.jpg"),
            alt: "Close account button",
          },
          {
            type: "text",
            content: isKo
              ? '"계정 삭제는 되돌릴 수 없으며 KYC 인증이 취소된다"는 경고 메시지를 확인한 후 \'Cancel account\'를 클릭합니다.'
              : "Confirm the warning message that 'account deletion is irreversible and KYC will be cancelled', then click 'Cancel account'.",
          },
          {
            type: "image",
            src: img(e, "사진3.jpg"),
            alt: "Account deletion warning",
          },
          {
            type: "warning",
            content: isKo
              ? "계정 삭제(Close account) 시 모든 거래 내역과 자산 정보가 소멸됩니다. 반드시 남은 자산을 타 거래소나 개인 지갑으로 전액 출금한 뒤 진행하시기 바랍니다."
              : "When closing your account, all transaction history and asset information will be permanently deleted. Make sure to withdraw all remaining assets to another exchange or personal wallet before proceeding.",
          },
          {
            type: "images",
            images: [
              { src: img(e, "사진4.jpg"), alt: "Confirmation step 1" },
              { src: img(e, "사진5.jpg"), alt: "Confirmation step 2" },
            ],
          },
          {
            type: "text",
            content: isKo
              ? "마지막으로 보안을 위해 비밀번호 입력 및 이메일/Google OTP 인증을 완료하면 모든 절차가 마무리됩니다."
              : "Finally, complete the password entry and email/Google OTP verification for security to finish the process.",
          },
          {
            type: "image",
            src: img(e, "사진6.jpg"),
            alt: "Security verification",
          },
        ],
      },
      {
        title: isKo
          ? "FuturesAI 비트겟 55% 페이백 가입 방법"
          : "How to Sign Up for 55% Payback with FuturesAI",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "전용 링크 접속: FuturesAI 공식 파트너 링크를 통해 가입 페이지로 이동합니다."
              : "Access the exclusive link: Navigate to the signup page through the FuturesAI official partner link.",
          },
          {
            type: "link",
            content: isKo
              ? "FuturesAI 비트겟(Bitget) 할인코드"
              : "FuturesAI Bitget Discount Code",
            href: "https://partner.bitget.com/bg/FuturesAI",
          },
          {
            type: "image",
            src: img(e, "사진7.jpg"),
            alt: "Bitget signup page",
          },
          {
            type: "text",
            content: isKo
              ? '링크를 통해 접속한 후 새로운 이메일 또는 휴대폰 번호와 비밀번호를 입력하고 레퍼럴 코드 "FuturesAI"가 정확히 입력되어 있는지 확인 후 신규 계정을 생성합니다.'
              : 'After accessing through the link, enter a new email or phone number and password, verify the referral code "FuturesAI" is correctly entered, then create a new account.',
          },
          {
            type: "text",
            content: isKo
              ? "FuturesAI 신규 계정으로 로그인 후 'Verify' 버튼을 눌러 인증을 진행합니다. 이 때 기존 계정에서 사용하지 않았던 신원인증 수단을 선택해야 인증이 완료됩니다."
              : "Log in with your new FuturesAI account and click the 'Verify' button to proceed with verification. You must select an identity verification method that was not used on the previous account.",
          },
          {
            type: "images",
            images: [
              { src: img(e, "사진8.jpg"), alt: "KYC step 1" },
              { src: img(e, "사진9.jpg"), alt: "KYC step 2" },
              { src: img(e, "사진10.jpg"), alt: "KYC step 3" },
            ],
          },
        ],
      },
    ],
  };
}

function getBybitGuide(isKo: boolean): GuideContent {
  const e = "bybit";
  return {
    sections: [
      {
        title: isKo
          ? "레퍼럴 코드 변경 & KYC 인증 변경 방법"
          : "Referral Code Change & KYC Change Method",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "바이비트(Bybit) 거래소는 레퍼럴 코드 변경은 신규 가입 후 14일 이내에만 변경 가능합니다."
              : "Bybit exchange only allows referral code changes within 14 days of initial signup.",
          },
          {
            type: "text",
            content: isKo
              ? "신규 가입 후 14일이 지났다면 FuturesAI 20% 페이백 혜택을 받기 위해서는 신규 계정으로 다시 가입해야 하며 개인당 최대 3개의 계정까지 생성이 가능합니다. 여권, 운전면허증, 신분증을 각각 한 번씩 KYC 인증에 사용할 수 있습니다."
              : "If more than 14 days have passed since signup, you'll need to create a new account to receive the 20% payback benefit. Up to 3 accounts per person are allowed. Passport, driver's license, and national ID can each be used once for KYC.",
          },
          {
            type: "info",
            content: isKo
              ? "레퍼럴 할인 코드 없이 신규 가입 후 14일이 지나지 않은 경우라면 바이비트 고객센터(admin@futuresai.io)에 문의하여 레퍼럴 코드를 등록할 수 있습니다."
              : "If you signed up without a referral code and it's been less than 14 days, you can contact Bybit support (admin@futuresai.io) to register a referral code.",
          },
          {
            type: "code",
            content: isKo
              ? `이메일 수신처: admin@futuresai.io
제목: 바이비트(Bybit) 레퍼럴 코드 변경 요청

안녕하세요.
아래와 같이 추천인 코드 등록하겠습니다.

바이비트(Bybit) 가입 시 사용한 이메일 주소 또는 휴대폰 번호:
바이비트(Bybit) 계정 UID: OOO (본인 UID)
등록할 레퍼럴 할인 코드: FUTURESAI`
              : `To: admin@futuresai.io
Subject: Bybit Referral Code Change Request

Hello,
I would like to register the following referral code.

Email or phone used for Bybit signup:
Bybit account UID: OOO (your UID)
Referral code to register: FUTURESAI`,
          },
        ],
      },
      {
        title: isKo
          ? "기존 계정 삭제하는 방법 (KYC 인증 취소)"
          : "How to Delete Existing Account (Cancel KYC)",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "바이비트(Bybit) 로그인 후 오른쪽 상단에 있는 아이콘 모양을 클릭하고, 'Account' 메뉴를 클릭합니다."
              : "After logging into Bybit, click the icon in the top right corner and select the 'Account' menu.",
          },
          {
            type: "image",
            src: img(e, "사진1.jpg"),
            alt: "Bybit account menu",
          },
          {
            type: "text",
            content: isKo
              ? "다음으로 스크롤바를 내려 하단에 'Deactivate an Account' 버튼을 클릭합니다."
              : "Next, scroll down and click the 'Deactivate an Account' button at the bottom.",
          },
          {
            type: "image",
            src: img(e, "사진2.jpg"),
            alt: "Deactivate account button",
          },
          {
            type: "image",
            src: img(e, "사진3.jpg"),
            alt: "Deactivation warnings",
          },
          {
            type: "warning",
            content: isKo
              ? "계정을 삭제하면 모든 거래 기록, 보유자산, 본인인증(KYC) 정보가 완전히 사라집니다. 계정 내 자금이 없어야 하며 자금이 전부 출금된 상태여야만 합니다. 삭제가 완료된 계정은 다시 복원하거나 재사용할 수 없으며 연결되어 있던 휴대폰 번호와 이메일 주소도 다른 계정에 재사용이 불가능합니다."
              : "Deleting your account will permanently remove all trading records, assets, and KYC information. The account must have zero balance with all funds withdrawn. Deleted accounts cannot be restored, and the linked phone number and email cannot be reused for other accounts.",
          },
          {
            type: "text",
            content: isKo
              ? "모든 내용을 확인했다면 'Deactivate This Account' 버튼을 누른 뒤, 'Confirm' 버튼을 클릭해 주세요."
              : "After confirming all details, click 'Deactivate This Account' then click 'Confirm'.",
          },
          {
            type: "image",
            src: img(e, "사진4.jpg"),
            alt: "Confirm deactivation",
          },
          {
            type: "text",
            content: isKo
              ? "다음으로 구글 OTP, 휴대폰 인증, 이메일 인증 등의 절차를 완료하면 바이비트(Bybit) 계정 탈퇴가 최종적으로 완료됩니다."
              : "Complete the Google OTP, phone verification, and email verification to finalize the Bybit account deletion.",
          },
        ],
      },
      {
        title: isKo
          ? "FuturesAI 바이비트 20% 페이백 가입 방법"
          : "How to Sign Up for 20% Payback with FuturesAI",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "전용 링크 접속: FuturesAI 공식 파트너 링크를 통해 가입 페이지로 이동합니다."
              : "Access the exclusive link: Navigate to the signup page through the FuturesAI official partner link.",
          },
          {
            type: "link",
            content: isKo
              ? "FuturesAI 바이비트(Bybit) 할인코드"
              : "FuturesAI Bybit Discount Code",
            href: "https://partner.bybit.com/b/FUTURESAI",
          },
          {
            type: "text",
            content: isKo
              ? '링크를 통해 접속한 후, 새로운 이메일(또는 휴대폰)과 비밀번호를 입력하고 레퍼럴 코드 \'FUTURESAI\' 확인 후 신규 계정을 생성합니다.'
              : "After accessing through the link, enter a new email (or phone) and password, verify the referral code 'FUTURESAI' is entered, then create a new account.",
          },
          { type: "image", src: img(e, "사진5.jpg"), alt: "Bybit signup page" },
          {
            type: "text",
            content: isKo
              ? "FuturesAI 신규 계정으로 로그인 후 'Verify' 버튼을 눌러 인증을 진행합니다. 이 때 기존 계정에서 사용하지 않았던 신원인증 수단을 선택해야 인증이 완료됩니다."
              : "Log in with your new account and click 'Verify'. You must choose an ID verification method not used on the previous account.",
          },
          {
            type: "images",
            images: [
              { src: img(e, "사진6.jpg"), alt: "KYC verification 1" },
              { src: img(e, "사진7.jpg"), alt: "KYC verification 2" },
            ],
          },
        ],
      },
    ],
  };
}

function getOkxGuide(isKo: boolean): GuideContent {
  const e = "okx";
  return {
    sections: [
      {
        title: isKo
          ? "레퍼럴 코드 변경 & KYC 인증 변경 방법"
          : "Referral Code Change & KYC Change Method",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "OKX(오케이엑스) 20% 페이백 혜택을 받기 위해서는 기존 계정을 탈퇴한 이후 신규 계정으로 다시 재가입해야 합니다. 다만 계정 삭제 후 30일 동안은 동일한 이메일 또는 휴대폰 번호로 가입할 수 없습니다."
              : "To receive the 20% payback benefit from OKX, you must close your existing account and re-register with a new one. Note: you cannot sign up with the same email or phone for 30 days after deletion.",
          },
          {
            type: "info",
            content: isKo
              ? "레퍼럴 변경은 다음 조건 중 하나만 충족해도 가능합니다:\n• 가입 90일 초과 + 최근 90일 거래량 1,000,000 USDT 이하\n• 신규 가입 7일 이내 (레퍼럴 채널 미경유)\n• 가입 31~90일 + 누적 거래량 100,000 USDT 이하"
              : "Referral change is possible if ANY of these conditions are met:\n• 90+ days since signup + less than 1M USDT volume in last 90 days\n• Within 7 days of signup (no referral channel)\n• 31-90 days since signup + less than 100K USDT cumulative volume",
          },
        ],
      },
      {
        title: isKo
          ? "기존 계정 삭제하는 방법 (KYC 인증 취소)"
          : "How to Delete Existing Account (Cancel KYC)",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "OKX(오케이엑스) 로그인 후 왼쪽 상단에 있는 네모 아이콘 모양을 클릭하고, 영어로 된 사용자명을 클릭합니다."
              : "After logging into OKX, click the square icon in the top left corner, then click your username.",
          },
          { type: "image", src: img(e, "사진1.jpg"), alt: "OKX profile menu" },
          {
            type: "text",
            content: isKo
              ? "다음으로 'Security' 보안 버튼을 클릭하고 스크롤바를 내려 하단에 'Close account' 버튼을 클릭합니다."
              : "Next, click the 'Security' button and scroll down to click 'Close account' at the bottom.",
          },
          {
            type: "images",
            images: [
              { src: img(e, "사진2.jpg"), alt: "Security settings" },
              { src: img(e, "사진3.jpg"), alt: "Close account option" },
            ],
          },
          {
            type: "text",
            content: isKo
              ? "계정을 탈퇴하는 이유를 선택하고 'Continue to close' 버튼을 클릭합니다."
              : "Select the reason for closing your account and click 'Continue to close'.",
          },
          {
            type: "image",
            src: img(e, "사진4.jpg"),
            alt: "Reason selection",
          },
          {
            type: "warning",
            content: isKo
              ? "삭제 절차가 진행되면 거래 이력, 보유 중인 자산, 본인 인증(KYC) 관련 정보가 모두 영구적으로 삭제됩니다. 계정에 남아 있는 자금이 없어야 하며 모든 자산이 출금된 상태여야 합니다. 탈퇴된 계정은 복구하거나 다시 사용할 수 없고, 연결되어 있던 이메일 주소나 휴대폰 번호는 30일 동안 다른 계정에 사용할 수 없습니다."
              : "Once the deletion process begins, all trading history, assets, and KYC information will be permanently deleted. The account must have zero balance. Deleted accounts cannot be restored, and linked email/phone cannot be reused for 30 days.",
          },
          {
            type: "images",
            images: [
              { src: img(e, "사진5.jpg"), alt: "Account closure step 1" },
              { src: img(e, "사진6.jpg"), alt: "Account closure step 2" },
            ],
          },
          {
            type: "text",
            content: isKo
              ? "모든 내용을 확인했다면 'I understand' 버튼을 클릭합니다. 다음으로 구글 OTP, 휴대폰 인증, 이메일 인증 등의 절차를 완료하면 OKX 계정 탈퇴가 최종적으로 완료됩니다."
              : "After reviewing everything, click 'I understand'. Then complete Google OTP, phone, and email verification to finalize the OKX account deletion.",
          },
        ],
      },
      {
        title: isKo
          ? "FuturesAI OKX 20% 페이백 가입 방법"
          : "How to Sign Up for 20% Payback with FuturesAI",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "페이백 20% 혜택을 받기 위해선 반드시 FuturesAI에서 제공하는 코드를 통해 가입해야 합니다."
              : "You must sign up through the FuturesAI code to receive the 20% payback benefit.",
          },
          {
            type: "link",
            content: isKo
              ? "FuturesAI OKX(오케이엑스) 할인코드"
              : "FuturesAI OKX Discount Code",
            href: "https://www.okx.com/join/futuresai",
          },
          {
            type: "text",
            content: isKo
              ? '링크를 통해 접속한 후 새로운 이메일 또는 휴대폰 번호와 비밀번호를 입력하고 "futuresai" 레퍼럴 코드가 정확히 입력되어 있는지 확인 후 신규 계정을 생성합니다.'
              : 'After accessing through the link, enter a new email or phone number and password, verify the referral code "futuresai" is correctly entered, then create a new account.',
          },
          { type: "image", src: img(e, "사진7.jpg"), alt: "OKX signup page" },
          {
            type: "text",
            content: isKo
              ? "FuturesAI 신규 계정으로 로그인 후 'Verify' 버튼을 눌러 인증을 진행합니다. 이 때 기존 계정에서 사용하지 않았던 신원인증 수단을 선택해야 인증이 완료됩니다."
              : "Log in with your new account and click 'Verify'. You must select an ID method not used on the previous account.",
          },
          {
            type: "images",
            images: [
              { src: img(e, "사진8.jpg"), alt: "KYC step 1" },
              { src: img(e, "사진9.jpg"), alt: "KYC step 2" },
              { src: img(e, "사진10.jpg"), alt: "KYC step 3" },
            ],
          },
        ],
      },
    ],
  };
}

function getGateGuide(isKo: boolean): GuideContent {
  const e = "gate";
  return {
    sections: [
      {
        title: isKo
          ? "레퍼럴 코드 변경 & KYC 인증 변경 방법"
          : "Referral Code Change & KYC Change Method",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "게이트(Gate) 거래소는 레퍼럴 코드 변경은 불가능합니다. 75% 페이백 혜택을 받기 위해서는 신규 계정으로 재가입해야 하며 한 명이 최대 3개의 계정을 생성할 수 있습니다."
              : "Gate.io does not allow referral code changes. To receive the 75% payback benefit, you must create a new account. Each person can create up to 3 accounts.",
          },
          {
            type: "text",
            content: isKo
              ? "여권, 운전면허증, 신분증을 각각 한 번씩 KYC 인증에 사용할 수 있습니다."
              : "You can use a passport, driver's license, or national ID card for KYC verification, each one time.",
          },
          {
            type: "list",
            items: isKo
              ? [
                  "계정 3개 모두 KYC 인증이 완료된 경우, 현재 계정을 삭제하고 KYC 인증을 취소합니다.",
                  "FuturesAI 게이트(Gate) 할인코드로 가입 후 KYC 인증을 완료합니다.",
                ]
              : [
                  "If all 3 accounts have completed KYC, delete the current account to cancel KYC verification.",
                  "Sign up with the FuturesAI Gate.io discount code and complete KYC verification.",
                ],
          },
        ],
      },
      {
        title: isKo
          ? "기존 계정 삭제하는 방법 (KYC 인증 취소)"
          : "How to Delete Existing Account (Cancel KYC)",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "게이트(Gate) 로그인 후 오른쪽 상단에 있는 아이콘 모양을 클릭하고, 영어로 된 사용자명을 클릭합니다."
              : "After logging into Gate.io, click the icon in the top right corner, then click your username.",
          },
          { type: "image", src: img(e, "사진1.jpg"), alt: "Gate profile menu" },
          {
            type: "text",
            content: isKo
              ? "다음으로 Security 보안 탭을 선택하고 하단에 'Close account' 버튼을 클릭합니다."
              : "Select the Security tab and click 'Close account' at the bottom.",
          },
          {
            type: "image",
            src: img(e, "사진2.jpg"),
            alt: "Security tab",
          },
          {
            type: "text",
            content: isKo
              ? "계정을 삭제하려는 이유를 선택하고 게이트(Gate) 계정 등록 취소 약관에 동의를 선택하고 다음으로 넘어갑니다."
              : "Select the reason for closing your account, agree to the account cancellation terms, and proceed.",
          },
          {
            type: "images",
            images: [
              { src: img(e, "사진3.jpg"), alt: "Reason selection" },
              { src: img(e, "사진4.jpg"), alt: "Terms agreement" },
              { src: img(e, "사진5.jpg"), alt: "Confirmation" },
            ],
          },
          {
            type: "warning",
            content: isKo
              ? "계정을 삭제하면 모든 거래 내역, 자산, KYC 인증 정보가 삭제됩니다. 남은 자산을 확인하고 보유한 자산을 모두 출금해 놓는 것이 중요합니다."
              : "Deleting your account will remove all trading history, assets, and KYC information. Make sure to check and withdraw all remaining assets.",
          },
          {
            type: "text",
            content: isKo
              ? "다음으로 계정 탈퇴를 위한 필요한 인증 절차(펀드 패스워드, 핸드폰인증, 이메일 인증 등)를 완료하면 계정 삭제가 마무리됩니다."
              : "Complete the required verification steps (fund password, phone verification, email verification) to finalize the account deletion.",
          },
          {
            type: "images",
            images: [
              { src: img(e, "사진6.jpg"), alt: "Verification step 1" },
              { src: img(e, "사진7.jpg"), alt: "Verification step 2" },
            ],
          },
        ],
      },
      {
        title: isKo
          ? "FuturesAI 게이트 75% 페이백 가입 방법"
          : "How to Sign Up for 75% Payback with FuturesAI",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "페이백 75% 혜택을 받기 위해선 반드시 FuturesAI에서 제공하는 코드를 통해 가입해야 합니다."
              : "You must sign up through the FuturesAI code to receive the 75% payback benefit.",
          },
          {
            type: "link",
            content: isKo
              ? "FuturesAI 게이트(Gate) 할인코드"
              : "FuturesAI Gate.io Discount Code",
            href: "https://www.gate.com/share/FuturesAI",
          },
          {
            type: "text",
            content: isKo
              ? '링크를 통해 접속한 후 새로운 이메일 또는 휴대폰 번호와 비밀번호를 입력하고 "RKCBNQNR" 레퍼럴 코드가 정확히 입력되어 있는지 확인 후 신규 계정을 생성합니다.'
              : 'After accessing through the link, enter a new email or phone and password, verify the referral code "RKCBNQNR" is correctly entered, then create a new account.',
          },
          { type: "image", src: img(e, "사진8.jpg"), alt: "Gate signup page" },
          {
            type: "text",
            content: isKo
              ? "FuturesAI 신규 계정으로 로그인 후 'Verify' 버튼을 눌러 인증을 진행합니다. 이 때 기존 계정에서 사용하지 않았던 신원인증 수단을 선택해야 인증이 완료됩니다."
              : "Log in with your new account and click 'Verify'. You must select an ID method not used on the previous account.",
          },
          {
            type: "images",
            images: [
              { src: img(e, "사진9.jpg"), alt: "KYC step 1" },
              { src: img(e, "사진10.jpg"), alt: "KYC step 2" },
            ],
          },
        ],
      },
    ],
  };
}

function getBingxGuide(isKo: boolean): GuideContent {
  const e = "bingx";
  return {
    sections: [
      {
        title: isKo
          ? "레퍼럴 코드 변경 & KYC 인증 변경 방법"
          : "Referral Code Change & KYC Change Method",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "빙엑스(BingX) 거래소는 레퍼럴 코드 변경은 불가능합니다. 50% 페이백 혜택을 받기 위해서는 신규 계정으로 다시 가입해야 하며 개인당 최대 3개의 계정까지 생성이 가능합니다."
              : "BingX does not allow referral code changes. To receive the 50% payback benefit, you must create a new account. Up to 3 accounts per person are allowed.",
          },
          {
            type: "text",
            content: isKo
              ? "여권, 운전면허증, 신분증을 각각 한 번씩 KYC 인증에 사용할 수 있습니다."
              : "You can use a passport, driver's license, or national ID card for KYC verification, each one time.",
          },
          {
            type: "list",
            items: isKo
              ? [
                  "계정 3개 모두 KYC 인증이 완료된 경우, 현재 계정을 삭제하고 KYC 인증을 취소합니다.",
                  "FuturesAI 빙엑스(BingX) 할인코드로 가입 후 KYC 인증을 완료합니다.",
                ]
              : [
                  "If all 3 accounts have completed KYC, delete the current account to cancel KYC.",
                  "Sign up with the FuturesAI BingX discount code and complete KYC verification.",
                ],
          },
        ],
      },
      {
        title: isKo
          ? "기존 계정 삭제하는 방법 (KYC 인증 취소)"
          : "How to Delete Existing Account (Cancel KYC)",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "빙엑스(BingX) 로그인 후 오른쪽 상단에 있는 아이콘 모양을 클릭하고, Security Center 메뉴를 클릭합니다."
              : "After logging into BingX, click the icon in the top right corner and select 'Security Center'.",
          },
          {
            type: "image",
            src: img(e, "사진1.jpg"),
            alt: "BingX account menu",
          },
          {
            type: "text",
            content: isKo
              ? "다음으로 스크롤바를 내려 하단에 'Delete your account' 버튼을 클릭합니다."
              : "Scroll down and click 'Delete your account' at the bottom.",
          },
          {
            type: "image",
            src: img(e, "사진2.jpg"),
            alt: "Delete account button",
          },
          {
            type: "images",
            images: [
              { src: img(e, "사진3.jpg"), alt: "Deletion warning 1" },
              { src: img(e, "사진4.jpg"), alt: "Deletion warning 2" },
            ],
          },
          {
            type: "warning",
            content: isKo
              ? "계정을 삭제하면 모든 거래 내역, 자산, KYC 인증 정보가 삭제됩니다. 자금이 없거나 모든 자금이 출금되어 있어야 합니다. 삭제된 계정은 복구하거나 다시 사용할 수 없으며 연결된 휴대폰 번호와 이메일을 다른 계정에 동일하게 사용할 수 없습니다."
              : "Deleting your account will remove all trading history, assets, and KYC information. The account must have zero balance. Deleted accounts cannot be restored, and linked phone/email cannot be reused.",
          },
          {
            type: "text",
            content: isKo
              ? "모두 확인을 했다면 'Apply for Deletion' 버튼을 클릭하고 'Delete' 버튼을 클릭합니다."
              : "After confirming, click 'Apply for Deletion' and then 'Delete'.",
          },
          {
            type: "image",
            src: img(e, "사진5.jpg"),
            alt: "Apply for deletion",
          },
          {
            type: "text",
            content: isKo
              ? "이후 빙엑스(BingX) 계정 탈퇴를 위한 필요한 인증 절차(구글OTP, 핸드폰인증, 이메일 인증 등)를 완료하면 계정 삭제가 마무리됩니다."
              : "Complete the required verification (Google OTP, phone, email) to finalize the account deletion.",
          },
        ],
      },
      {
        title: isKo
          ? "FuturesAI 빙엑스 50% 페이백 가입 방법"
          : "How to Sign Up for 55% Payback with FuturesAI",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "페이백 50% 혜택을 받기 위해선 반드시 FuturesAI에서 제공하는 코드를 통해 가입해야 합니다."
              : "You must sign up through the FuturesAI code to receive the 50% payback benefit.",
          },
          {
            type: "link",
            content: isKo
              ? "FuturesAI 빙엑스(BingX) 할인코드"
              : "FuturesAI BingX Discount Code",
            href: "https://bingx.com/en/invite/FCC9QDJK",
          },
          {
            type: "text",
            content: isKo
              ? '링크를 통해 접속한 후 새로운 이메일 또는 휴대폰 번호와 비밀번호를 입력하고 "FCC9QDJK" 레퍼럴 코드가 정확히 입력되어 있는지 확인 후 신규 계정을 생성합니다.'
              : 'After accessing through the link, enter a new email or phone and password, verify the referral code "FCC9QDJK" is correctly entered, then create a new account.',
          },
          {
            type: "image",
            src: img(e, "사진6.jpg"),
            alt: "BingX signup page",
          },
          {
            type: "text",
            content: isKo
              ? "FuturesAI 신규 계정으로 로그인 후 'Verify' 버튼을 눌러 인증을 진행합니다. 이 때 기존 계정에서 사용하지 않았던 신원인증 수단을 선택해야 인증이 완료됩니다."
              : "Log in with your new account and click 'Verify'. You must select an ID method not used on the previous account.",
          },
          {
            type: "images",
            images: [
              { src: img(e, "사진7.jpg"), alt: "KYC step 1" },
              { src: img(e, "사진8.jpg"), alt: "KYC step 2" },
              { src: img(e, "사진9.jpg"), alt: "KYC step 3" },
            ],
          },
        ],
      },
    ],
  };
}

function getHtxGuide(isKo: boolean): GuideContent {
  const e = "htx";
  return {
    sections: [
      {
        title: isKo
          ? "레퍼럴 코드 변경 & KYC 인증 변경 방법"
          : "Referral Code Change & KYC Change Method",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "HTX(구 후오비) 거래소는 레퍼럴 코드 변경은 불가능합니다. 54% 페이백 혜택을 받기 위해서는 신규 계정으로 다시 가입해야 하며 개인당 최대 3개의 계정까지 생성이 가능합니다."
              : "HTX (formerly Huobi) does not allow referral code changes. To receive the 54% payback benefit, you must create a new account. Up to 3 accounts per person are allowed.",
          },
          {
            type: "text",
            content: isKo
              ? "여권, 운전면허증, 신분증을 각각 한 번씩 KYC 인증에 사용할 수 있습니다."
              : "You can use a passport, driver's license, or national ID card for KYC verification, each one time.",
          },
          {
            type: "image",
            src: img(e, "사진1.jpg"),
            alt: "HTX exchange",
          },
        ],
      },
      {
        title: isKo
          ? "기존 계정 삭제하는 방법 (KYC 인증 취소)"
          : "How to Delete Existing Account (Cancel KYC)",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "HTX(구 후오비) 로그인 후 오른쪽 하단 고객센터 또는 도움말 센터에 접속합니다. 우측 하단 프로필 아이콘 클릭 → 하단 메뉴에서 \"Contact Support\" 클릭합니다."
              : "After logging into HTX, access the help center at the bottom right. Click the profile icon → select 'Contact Support' from the bottom menu.",
          },
          {
            type: "image",
            src: img(e, "사진2.jpg"),
            alt: "HTX support menu",
          },
          {
            type: "text",
            content: isKo
              ? 'Help Center에서 검색창에 "Close account" 또는 "Delete account"를 입력하거나 아래 절차대로 직접 문의합니다.'
              : 'In the Help Center, search for "Close account" or "Delete account", or submit a request directly.',
          },
          {
            type: "image",
            src: img(e, "사진3.jpg"),
            alt: "Help center search",
          },
          {
            type: "info",
            content: isKo
              ? 'Submit a Request (문의 제출)\n유형: Account Issue 또는 Others\n제목: "Request for Account Deletion"\n내용: I would like to permanently delete my HTX (Huobi) account. Please proceed with account deactivation and confirm once completed.\nEmail: [등록된 이메일 주소]\nUID: [계정 UID 또는 휴대폰 번호]\n\n※ 반드시 등록된 이메일로 접속한 상태에서 문의 제출해야 처리됩니다.'
              : 'Submit a Request:\nType: Account Issue or Others\nSubject: "Request for Account Deletion"\nContent: I would like to permanently delete my HTX (Huobi) account. Please proceed with account deactivation and confirm once completed.\nEmail: [your registered email]\nUID: [your account UID or phone number]\n\nNote: You must submit from your registered email.',
          },
          {
            type: "text",
            content: isKo
              ? "보안 강화를 위해 신분증/본인확인 영상 또는 등록 이메일로 확인 메일을 보낼 수 있습니다."
              : "For security, they may request ID verification or a confirmation email to your registered address.",
          },
          {
            type: "image",
            src: img(e, "사진4.jpg"),
            alt: "ID verification request",
          },
          {
            type: "warning",
            content: isKo
              ? "HTX(구 후오비) 거래소는 타 거래소와 다르게 취소 사유를 직접 입력하고 신원확인을 위한 신분증 사진을 업로드해야 하기 때문에 조금은 번거로울 수 있습니다. 이후 검토기간을 거쳐 문제가 없을 경우 계정 탈퇴처리가 완료됩니다."
              : "Unlike other exchanges, HTX requires you to manually write the cancellation reason and upload ID photos, which can be more complex. After a review period, the account will be deleted if there are no issues.",
          },
          {
            type: "image",
            src: img(e, "사진5.jpg"),
            alt: "Account deletion confirmation",
          },
        ],
      },
      {
        title: isKo
          ? "FuturesAI HTX 54% 페이백 가입 방법"
          : "How to Sign Up for 20% Payback with FuturesAI",
        blocks: [
          {
            type: "text",
            content: isKo
              ? "페이백 54% 혜택을 받기 위해선 반드시 FuturesAI에서 제공하는 코드를 통해 가입해야 합니다."
              : "You must sign up through the FuturesAI code to receive the 54% payback benefit.",
          },
          {
            type: "link",
            content: isKo
              ? "FuturesAI HTX(구 후오비) 할인코드"
              : "FuturesAI HTX Discount Code",
            href: "https://www.htx.com.gt/invite-register?inviter_id=11343840&invite_code=miqkc223",
          },
          {
            type: "text",
            content: isKo
              ? '링크를 통해 접속한 후 새로운 이메일 또는 휴대폰 번호와 비밀번호를 입력하고 "miqkc223" 레퍼럴 코드가 정확히 입력되어 있는지 확인 후 신규 계정을 생성합니다.'
              : 'After accessing through the link, enter a new email or phone and password, verify the referral code "miqkc223" is correctly entered, then create a new account.',
          },
          {
            type: "image",
            src: img(e, "사진6.jpg"),
            alt: "HTX signup page",
          },
          {
            type: "text",
            content: isKo
              ? "FuturesAI 신규 계정으로 로그인 후 'Unverified' 버튼을 눌러 인증을 진행합니다. 이 때 기존 계정에서 사용하지 않았던 신원인증 수단을 선택해야 인증이 완료됩니다."
              : "Log in with your new account and click 'Unverified'. You must select an ID method not used on the previous account.",
          },
          {
            type: "images",
            images: [
              { src: img(e, "사진7.jpg"), alt: "KYC step 1" },
              { src: img(e, "사진8.jpg"), alt: "KYC step 2" },
              { src: img(e, "사진9.jpg"), alt: "KYC step 3" },
            ],
          },
        ],
      },
    ],
  };
}

export function getGuideContent(
  slug: string,
  isKo: boolean
): GuideContent | null {
  switch (slug) {
    case "bitget":
      return getBitgetGuide(isKo);
    case "bybit":
      return getBybitGuide(isKo);
    case "okx":
      return getOkxGuide(isKo);
    case "gate":
      return getGateGuide(isKo);
    case "bingx":
      return getBingxGuide(isKo);
    case "htx":
      return getHtxGuide(isKo);
    default:
      return null;
  }
}
