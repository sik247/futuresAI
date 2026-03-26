import { auth } from "@/auth";
import { redirect } from "next/navigation";
import OrderImport from "./order-import";

export const metadata = {
  title: "Import Orders - FuturesAI",
  description: "Import your exchange orders via screenshot or CSV/Excel upload",
};

export default async function ImportPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const session = await auth();
  if (!session?.user?.email) redirect(`/${lang}/login`);

  return (
    <div className="bg-zinc-950 min-h-screen">
      <OrderImport lang={lang} />
    </div>
  );
}
