import Container from "@/components/ui/container";
import SubscriptionPage from "./subscription-page";

export const metadata = {
  title: "AI Chart Analysis - Free Access",
  description: "AI-powered chart analysis with live market data, news sentiment, and quantitative insights. Currently free for all users.",
};

export default function Page({ params }: { params: { lang: string } }) {
  return (
    <Container className="py-12">
      <SubscriptionPage lang={params.lang} />
    </Container>
  );
}
