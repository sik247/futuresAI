import Container from "@/components/ui/container";
import React from "react";
import { FirstSection } from "./first-section";
import { SecondSection } from "./second-section";
import { ThirdSection } from "./third-section";
import { FourthSection } from "./fourth-section";
import { FifthSection } from "./fifth-section";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAnimationProps } from "@/lib/utils/get-animation-props";

type TServicesPage = {};

const ServicesPage: React.FC<TServicesPage> = ({}) => {
  return (
    <Container className="grid grid-cols-1 gap-16 max-md:gap-10">
      <FirstSection />
      <SecondSection />
      <ThirdSection />
      <FourthSection />
      <FifthSection />
      <div className="text-center max-md:px-4">
        <p
          className="text-3xl max-md:text-xl font-bold text-foreground md:p-6 shrink-0"
          {...getAnimationProps("up", 500, 0)}
        >
          서비스를 이용하려면 어떻게 해야할까요?
        </p>
        <Link href={"/exchanges"} {...getAnimationProps("up", 500, 200)}>
          <Button className="bg-foreground text-background rounded-full w-full my-12 max-md:my-6 text-base font-bold py-8">
            제휴 거래소 둘러보기
          </Button>
        </Link>
      </div>
    </Container>
  );
};

export default ServicesPage;
