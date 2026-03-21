import React from "react";
import ThemeProvider from "./theme-provider";
import AosInitializer from "./aos-initializer";

type TProviders = {
  children: React.ReactNode;
};

const Providers: React.FC<TProviders> = ({ children }) => {
  return (
    <>
      <AosInitializer />
      <ThemeProvider>{children}</ThemeProvider>
    </>
  );
};

export default Providers;
