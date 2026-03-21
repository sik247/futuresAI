import Headers from "@/components/headers";
import Footer from "@/components/footer";
import NavigationMenuSection from "./navigation-menu-section";
import Container from "@/components/ui/container";

export default function MyPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Container className="w-full flex max-w-6xl gap-8">
        <div className="w-[200px] overflow-scroll py-4 bg-background h-screen relative max-md:hidden shrink-0">
          <NavigationMenuSection />
        </div>
        <div className="w-full">{children}</div>
      </Container>
    </>
  );
}
