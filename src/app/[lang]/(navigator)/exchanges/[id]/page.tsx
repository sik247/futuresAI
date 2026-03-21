import Container from "@/components/ui/container";
import React from "react";
import { DetailHeader } from "./detail-header";
import { exchangesService } from "@/lib/services/exchanges/exchanges.service";
import { Separator } from "@radix-ui/react-separator";
import { DetailContent } from "./detail-content";

type TExchangeDetailPage = {
  params: { id: string };
};

const ExchangeDetailPage: React.FC<TExchangeDetailPage> = async ({
  params: { id },
}) => {
  const exchange = await exchangesService.getById(id);
  if (!exchange) return null;
  return (
    <Container className="py-16 max-md:pt-6 grid grid-cols-1 gap-6 max-md:px-4">
      <DetailHeader exchange={exchange} />
      <section defaultValue="policy" className="py-4">
        <Separator className="mb-6" />
        <DetailContent exchange={exchange} />
      </section>
    </Container>
  );
};

export default ExchangeDetailPage;
