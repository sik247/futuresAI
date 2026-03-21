"use client";
import React, { useEffect, useState } from "react";
import { ThemeProvider as NextThemeProvider } from "next-themes";

type TThemeProvider = {
  children: React.ReactNode;
};

const ThemeProvider: React.FC<TThemeProvider> = ({ children }) => {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NextThemeProvider
      defaultTheme="system"
      enableSystem={true}
      attribute="class"
    >
      {children}
    </NextThemeProvider>
  );
};

export default ThemeProvider;
