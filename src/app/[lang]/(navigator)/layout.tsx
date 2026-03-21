import { getDictionary } from "@/i18n";
import Headers from "@/components/headers";
import Footer from "@/components/footer";
import { Metadata } from "next";

export async function generateMetadata({
  params: { lang }
}: {
  params: { lang: string }
}): Promise<Metadata> {
  await getDictionary(lang);

  return {
    title: "Futures & AI | Payback Admin Dashboard",
    description:
      "Monitor affiliate commissions across all exchanges. Track your payback earnings and maximize your returns.",
  };
}

export default async function LanguageLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const dictionary = await getDictionary(lang);

  return (
    <>
      <Headers lang={lang} translations={dictionary} />
      <main>{children}</main>
      <Footer translations={dictionary} />
    </>
  );
}

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }];
}
