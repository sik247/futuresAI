import Container from "@/components/ui/container";
import { getDictionary } from "@/i18n";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Live Intelligence | Futures AI",
  description:
    "Real-time crypto intelligence — charts, whale tracking, prediction markets, and social feeds.",
};

const SECTIONS = [
  {
    path: "charts",
    title: "Charts & Sentiment",
    description: "TradingView charts, Fear & Greed Index, and market screener",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    path: "markets",
    title: "Prediction Markets",
    description: "Live crypto prediction markets from Polymarket",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
      </svg>
    ),
  },
  {
    path: "whales",
    title: "Major Fund Tracker",
    description: "WLFI, BlackRock, Grayscale, Fidelity, MicroStrategy wallets",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    path: "sns",
    title: "Crypto Social",
    description: "X feed, live streams, and Futures AI shorts",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
];

export default async function LivePage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const dict = await getDictionary(lang);

  return (
    <div className="pt-20 pb-16 min-h-screen bg-zinc-950">
      <Container className="flex flex-col gap-16">
        {/* Hero */}
        <section className="py-16">
          <div className="inline-block mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] text-xs font-medium text-zinc-400 uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live Data
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-serif font-bold text-zinc-100 tracking-tight leading-[0.9]">
            Live{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              Intelligence
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mt-8 leading-relaxed">
            Your crypto command center — charts, prediction markets, whale
            tracking, and social feeds.
          </p>
        </section>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Section Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SECTIONS.map((section) => (
            <Link
              key={section.path}
              href={`/${lang}/${section.path}`}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-8 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 flex flex-col"
            >
              <div className="text-zinc-400 group-hover:text-emerald-400 transition-colors mb-6">
                {section.icon}
              </div>
              <h2 className="text-2xl font-serif font-bold text-zinc-100 mb-2">
                {section.title}
              </h2>
              <p className="text-zinc-500 flex-1">
                {section.description}
              </p>
              <div className="flex items-center gap-1.5 text-sm text-zinc-500 group-hover:text-emerald-400 transition-colors mt-6">
                <span>Explore</span>
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </section>
      </Container>
    </div>
  );
}
