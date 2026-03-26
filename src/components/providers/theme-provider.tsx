"use client";
import React from "react";
import { ThemeProvider as NextThemeProvider } from "next-themes";

type TThemeProvider = {
  children: React.ReactNode;
};

const ThemeProvider: React.FC<TThemeProvider> = ({ children }) => {
  return (
    <NextThemeProvider
      defaultTheme="dark"
      enableSystem={true}
      attribute="class"
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
};

export default ThemeProvider;
