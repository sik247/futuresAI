import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LangRoot({
  params: { lang },
}: {
  params: { lang: string };
}) {
  permanentRedirect(`/${lang}/sns`);
}
