import Container from "@/components/ui/container";
import React from "react";
import { MeHeaderSection } from "./me-header-section";
import { MeMenuSection } from "./me-menu-section";
import { Separator } from "@/components/ui/separator";

type TMePage = {};

const MePage: React.FC<TMePage> = async ({}) => {
  return (
    <div className="bg-muted w-full">
      <Container className="bg-background min-h-screen pb-20 lg:pb-0 px-6 md:px-0 w-full flex flex-col">
        <MeHeaderSection />
        <Separator />
        <MeMenuSection />
      </Container>
    </div>
  );
};

export default MePage;
