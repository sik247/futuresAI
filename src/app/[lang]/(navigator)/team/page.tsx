import Container from "@/components/ui/container";
import { getDictionary } from "@/i18n";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Team | Futures & AI",
  description:
    "Meet the team behind Futures & AI. Experienced traders and developers building the future of crypto trading.",
};

const TEAM_MEMBERS = [
  {
    name: "Harry Kang",
    role: "Founder & CEO",
    bio: "Full-stack developer and crypto trader with 5+ years of experience in DeFi and exchange integrations.",
    avatar: "HK",
    color: "from-blue-500 to-cyan-400",
  },
  {
    name: "Alex Chen",
    role: "Head of Trading",
    bio: "Former institutional trader specializing in derivatives and market microstructure. Building smarter trading tools.",
    avatar: "AC",
    color: "from-cyan-500 to-pink-400",
  },
  {
    name: "Sarah Kim",
    role: "Community Manager",
    bio: "Connecting traders worldwide. Focused on building an inclusive and supportive crypto trading community.",
    avatar: "SK",
    color: "from-orange-500 to-yellow-400",
  },
  {
    name: "David Park",
    role: "Lead Developer",
    bio: "Backend architect with expertise in real-time data systems, exchange APIs, and high-frequency trading infrastructure.",
    avatar: "DP",
    color: "from-green-500 to-emerald-400",
  },
  {
    name: "Emily Zhang",
    role: "Content & Research",
    bio: "Crypto analyst and content creator. Delivers daily market insights and educational trading content.",
    avatar: "EZ",
    color: "from-red-500 to-rose-400",
  },
  {
    name: "James Lee",
    role: "Partnerships",
    bio: "Building strategic partnerships with top exchanges. Negotiating the best payback rates for our community.",
    avatar: "JL",
    color: "from-blue-500 to-cyan-400",
  },
];

const VALUES = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Transparency",
    desc: "Every payback rate, fee, and commission is fully disclosed. No hidden charges, ever.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Community First",
    desc: "We exist for traders. Our platform is built on community feedback and shared knowledge.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Innovation",
    desc: "Constantly improving our tools, integrations, and payback systems to maximize your returns.",
  },
];

export default async function TeamPage({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const dict = await getDictionary(lang);

  return (
    <div className="pt-20 pb-16 min-h-screen">
      <Container className="flex flex-col gap-16">
        {/* Hero */}
        <section className="text-center pt-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Meet Our {dict.team}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We are traders, developers, and community builders united by a
            mission: to give every crypto trader the best possible edge.
          </p>
        </section>

        {/* Team Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.name}
              className="group rounded-lg bg-card border border-border p-6 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-14 h-14 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-lg opacity-80`}
                >
                  {member.avatar}
                </div>
                <div>
                  <h3 className="text-foreground font-semibold text-lg">
                    {member.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">{member.role}</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {member.bio}
              </p>
            </div>
          ))}
        </section>

        {/* Values */}
        <section>
          <h2 className="text-3xl font-serif font-bold text-foreground text-center mb-10">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="rounded-lg bg-card border border-border p-8 text-center"
              >
                <div className="text-foreground flex justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="text-foreground font-semibold text-lg mb-2">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 rounded-lg bg-secondary border border-border">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">
            Join Our Team
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            We are always looking for talented traders, developers, and
            community leaders to join us.
          </p>
          <a
            href="mailto:crypto-x@gmail.com"
            className="inline-block px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Get in Touch
          </a>
        </section>
      </Container>
    </div>
  );
}
