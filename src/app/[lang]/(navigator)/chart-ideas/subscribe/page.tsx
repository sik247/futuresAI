import Container from "@/components/ui/container";
import SubscriptionPage from "./subscription-page";

export const metadata = {
  title: "Pro Chart Analysis - Subscribe",
  description: "Subscribe to Pro for AI-powered chart analysis with live market data, news sentiment, and quantitative insights.",
};

export default function Page({ params }: { params: { lang: string } }) {
  return (
    <Container className="py-12">
      <SubscriptionPage lang={params.lang} />
    </Container>
  );
}
