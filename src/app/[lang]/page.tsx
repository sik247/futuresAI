import { redirect } from "next/navigation";

export default function LangRoot({
  params: { lang },
}: {
  params: { lang: string };
}) {
  redirect(`/${lang}/dashboard`);
}
