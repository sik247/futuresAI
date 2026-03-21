import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import React from "react";

type TFeatureCard = {
  href: string;
  title: string;
  subtitle: string;
  description: string;
};
const FeatureCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TFeatureCard
>(({ title, subtitle, description, href, ...props }, ref) => {
  return (
    <Card {...props} ref={ref}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className=" text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line">{description}</p>
      </CardContent>
      <CardFooter>
        <Link href={href}>
          <Button>Go to {title}</Button>
        </Link>
      </CardFooter>
    </Card>
  );
});

FeatureCard.displayName = "FeatureCard";

export default FeatureCard;
