import { getDictionary } from "@/i18n";
import Headers from "@/components/headers";
import Footer from "@/components/footer";
import { Metadata } from 'next';

export async function generateMetadata({
  params: { lang }
}: {
  params: { lang: string }
}): Promise<Metadata> {
  const dictionary = await getDictionary(lang);

  return {
    title: "Futures & AI | AI-Powered Crypto Intelligence",
    description: "Maximize your trading rebates with Futures & AI. Connect your exchange and start earning paybacks on every trade.",
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
