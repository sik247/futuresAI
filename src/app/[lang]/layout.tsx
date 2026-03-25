import { LangSetter } from "@/components/lang-setter";

export default function LangLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  return (
    <>
      <LangSetter lang={lang} />
      {children}
    </>
  );
}

export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "ko" }];
}
