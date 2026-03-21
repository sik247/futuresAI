import Container from "@/components/ui/container";
import React from "react";
import { ExchangeListSection } from "./exchange-list-section";
import { exchangesService } from "@/lib/services/exchanges/exchanges.service";
import { getExchanges } from "./actions";

export const dynamic = "force-dynamic";

type TExchangesPage = {};

const ExchangesPage: React.FC<TExchangesPage> = async ({}) => {
  const exchanges = await getExchanges();
  return (
    <div className="bg-muted">
      <Container className="py-16 max-md:py-10 grid grid-cols-1 gap-16">
        <ExchangeListSection type="recommended" exchanges={exchanges} />
      </Container>
    </div>
  );
};

export default ExchangesPage;
