import Container from "@/components/ui/container";
import { Metadata } from "next";
import { fetchCryptoFeed } from "@/lib/services/social/x-feed.service";
import SnsClient from "./sns-client";

export const metadata: Metadata = {
  title: "Crypto Social | Futures & AI",
  description: "Crypto X feed, live trading streams, and Futures & AI shorts.",
};

const YOUTUBE_CHANNEL = "Futures & AI";

const LIVE_STREAMS = [
  { title: "Bitcoin Live Price & Trading", channelName: "CoinDesk", embedId: "5KaNRCa1YuE" },
  { title: "Crypto Market Live", channelName: "CryptosRUs", embedId: "rSS5_P80GEQ" },
  { title: "Live Bitcoin Trading", channelName: "Ivan on Tech", embedId: "21X5lGlDOfg" },
];

const ALPHAI_SHORTS = [
  "1bZZIc2YglI", "3ilalTx5aPM", "78FoZ2PIzfY", "BGga9-UTW14",
  "BqVLcDRlRB8", "CO5YhZ1VgsQ", "Cy_K5UuMiks", "GySUu12FAq0",
  "HdlwZWeFUPs", "I-cOt7tYGYs", "IpnDPuQlmos", "REdP3WKp4iE",
  "UWnsDSqcAeU", "ViOq5IwWcLQ", "Xor9hKNCPOQ", "YoFxQe0xqsQ",
  "aRkECVfI8AQ", "cdxPv2ciK84", "eZY45Ftjqqs", "fBaRHZgIXbw",
  "kYRUzjKfluc", "kk2lMxmxU5Y", "n0IbKn8AdC8", "nml6QAMlxmU",
  "qWy8EiE0to8", "qoKrYblbP5A", "rrJQWec0xsw", "tJuD3h1SbY4",
  "y-z7mA1CiIk", "yM9cgaUxif4", "ymLoLSnsb5U",
];

export default async function SnsPage() {
  const feedItems = await fetchCryptoFeed();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-zinc-950 to-zinc-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-cyan-600/5 rounded-full blur-[80px]" />

        <Container className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-blue-500 to-transparent" />
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-blue-400/80">
              Real-Time Feed
            </p>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white tracking-tighter leading-[0.85]">
            CRYPTO
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
              SOCIAL
            </span>
          </h1>

          <p className="text-base md:text-lg text-zinc-400 max-w-lg leading-relaxed">
            Live X feed from top crypto analysts, whale trackers, and exchanges.
            Trading streams and shorts from the community.
          </p>

          {/* Stats bar */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Live</span>
            </div>
            <div className="h-4 w-px bg-zinc-800" />
            <span className="text-xs text-zinc-500">
              {feedItems.length} tweets from 10 accounts
            </span>
            <div className="h-4 w-px bg-zinc-800" />
            <span className="text-xs text-zinc-500">Updated every 10 min</span>
          </div>
        </Container>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      {/* Live X Feed Section */}
      <section className="py-16">
        <Container className="flex flex-col gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Crypto X Feed
              </h2>
            </div>
            <p className="text-zinc-500 text-sm">
              Latest posts from top crypto analysts, news outlets, and whale trackers
            </p>
          </div>

          <SnsClient feedItems={feedItems} />
        </Container>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      {/* Live Streams Section */}
      <section className="py-16">
        <Container className="flex flex-col gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Live Streams
              </h2>
            </div>
            <p className="text-zinc-500 text-sm">
              Live trading and analysis from top crypto channels
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {LIVE_STREAMS.map((stream) => (
              <div
                key={stream.embedId}
                className="group rounded-2xl overflow-hidden bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-md hover:border-zinc-700/80 transition-all duration-300"
              >
                <div className="aspect-video relative">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${stream.embedId}?autoplay=0`}
                    title={stream.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="border-0"
                  />
                  {/* Live badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                    </span>
                    Live
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-zinc-100 text-sm">{stream.title}</h3>
                  <p className="text-zinc-500 text-xs mt-1">{stream.channelName}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      {/* Futures & AI Shorts Section */}
      <section className="py-16 pb-24">
        <Container className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Futures & AI Shorts
              </h2>
              <p className="text-zinc-500 text-sm mt-2">
                @{YOUTUBE_CHANNEL} -- Quick trading insights and market analysis
              </p>
            </div>
            <a
              href={`https://www.youtube.com/@${YOUTUBE_CHANNEL}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-200 text-sm font-medium hover:bg-zinc-700/80 hover:border-zinc-600/50 transition-all duration-200"
            >
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              Subscribe
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {ALPHAI_SHORTS.map((id) => (
              <a
                key={id}
                href={`https://www.youtube.com/shorts/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-xl overflow-hidden bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="aspect-[9/16]">
                  <img
                    src={`https://i.ytimg.com/vi/${id}/oar2.jpg`}
                    alt="Futures & AI Short"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                  Shorts
                </div>
              </a>
            ))}
          </div>

          {/* Mobile subscribe button */}
          <a
            href={`https://www.youtube.com/@${YOUTUBE_CHANNEL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:hidden flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-200 text-sm font-medium hover:bg-zinc-700/80 transition-all duration-200"
          >
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Subscribe to Futures & AI
          </a>
        </Container>
      </section>
    </div>
  );
}
