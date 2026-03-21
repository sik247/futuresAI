import type { Metadata } from "next";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/components/providers/providers";
import Loading from "@/components/ui/loading";
import { GlobalAlertDialog } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import SessionProviders from "@/components/providers/session-provider";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("bg-background text-foreground")}>
        <Providers>
          <SessionProviders>{children}</SessionProviders>
          <Toaster />
          <Loading />
          <GlobalAlertDialog />
        </Providers>
      </body>
    </html>
  );
}