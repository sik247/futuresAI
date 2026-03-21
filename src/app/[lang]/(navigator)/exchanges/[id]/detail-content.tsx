import { Separator } from "@/components/ui/separator";
import { ChartBarSquareIcon } from "@heroicons/react/24/solid";
import { Exchange } from "@prisma/client";
import Image from "next/image";
import React from "react";

type TDetailContent = {
  exchange: Exchange;
};

const GuideNavigation = [
  { id: "1", title: "크립토엑스 코드로 거래소 가입하기" },
  { id: "2", title: "크립토엑스에 UID 연결하기" },
  { id: "3", title: "트레이딩 마음껏 즐기기" },
  { id: "4", title: "페이백 환급받기!" },
];

const DetailContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TDetailContent
>(
  (
    {
      exchange: { name, paybackRatio, limitFee, marketFee, averageIncome },
      ...props
    },
    ref
  ) => {
    paybackRatio = paybackRatio;
    return (
      <section ref={ref} {...props} className="grid grid-cols-1 gap-6">
        <div className="py-6">
          <p className="text-base font-bold text-foreground pb-6 gpa-0">
            {name} 페이백 정책
          </p>
          <div className="grid grid-cols-2 max-md:grid-cols-1 gap-6">
            <div className="border border-border rounded-2xl bg-background">
              <div className="p-3 flex justify-start items-center">
                <Image
                  src={"/icons/exchanges-icons/statistics/calculator.png"}
                  alt="calculator"
                  width={40}
                  height={40}
                  className="mr-3"
                />
                <div>
                  <p className="text-xs font-medium text-muted-foreground pb-2">
                    지정가 수수료
                  </p>
                  <p className="text-foreground text-base font-bold">
                    {limitFee}%
                  </p>
                </div>
              </div>
              <Separator />
              <div className="p-3 flex justify-start items-center">
                <Image
                  src={"/icons/exchanges-icons/statistics/coins.png"}
                  alt="coins"
                  width={40}
                  height={40}
                  className="mr-2"
                />
                <div>
                  <p className="text-xs font-medium text-muted-foreground  pb-2">
                    시장가 수수료
                  </p>
                  <p className="text-foreground text-base font-bold">
                    {marketFee}%
                  </p>
                </div>
              </div>
            </div>
            <div className="border border-border rounded-2xl bg-background">
              <div className="p-3 flex justify-start items-center">
                <Image
                  src={"/icons/exchanges-icons/statistics/atm.png"}
                  alt="calculator"
                  width={40}
                  height={40}
                  className="mr-3"
                />
                <div>
                  <p className="text-xs font-medium text-muted-foreground pb-2">
                    수수료 페이백
                  </p>
                  <p className="text-foreground text-base font-bold">
                    {paybackRatio.toFixed(0)}%
                  </p>
                </div>
              </div>
              <Separator />
              <div className="p-3 flex justify-start items-center">
                <Image
                  src={
                    "/icons/exchanges-icons/statistics/paper-money-hands.png"
                  }
                  alt="coins"
                  width={40}
                  height={40}
                  className="mr-2"
                />
                <div>
                  <p className="text-xs font-medium text-muted-foreground  pb-2">
                    1인 평균 환급액
                  </p>
                  <p className="text-foreground text-base font-bold">
                    {averageIncome}만원
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="py-6">
          <p className="pb-6 text-base font-bold text-foreground gpa-0">
            {name} 페이백 받는 방법?
          </p>
          <div className="grid grid-cols-1 gap-5">
            {GuideNavigation.map((item) => (
              <div key={item.id} className="flex items-center">
                <div className="flex justify-center items-center rounded-xl max-md:rounded-md w-16 h-16 max-md:w-8 max-md:h-8 bg-foreground text-2xl max-md:text-xl font-semibold text-background mr-8 max-md:mr-4">
                  {item.id}
                </div>
                <p className="text-lg max-md:text-base font-medium">
                  {item.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6">
          <p className="text-xs font-semibold pb-2">유의사항</p>
          <p className="text-xs font-light text-foreground">
            거래소에서 지급하는 증정금 및 보너스는 페이백 해당사항이 아닙니다.
            당사 혹은 거래소의 사정으로 페이백 조건은 변경될 수 있습니다. 당사
            혹은 거래소의 사정으로 제휴관계는 종료될 수 있으며, 이후에는 페이백
            서비스를 이용하기 어려울 수 있습니다. 이벤트 보상을 받기 위한 고빈도
            거래는 거래소에서 규정 위반으로 간주됩니다. 규정 위반에 대한 커미션
            중단 처리는 크립토엑스에서도 동일하게 적용됩니다. 또한 리스크 컨트롤
            규정 위반과 고빈도 거래에 관한 내용은 각거래소의 정책 규정을
            참조해주시길 바랍니다.
          </p>
        </div>
      </section>
    );
  }
);

DetailContent.displayName = "DetailContent";

export { DetailContent };
