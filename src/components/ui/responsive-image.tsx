import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";

const ResponsiveImage = React.forwardRef<
  HTMLImageElement,
  React.ComponentPropsWithoutRef<"img"> & {
    src: string;
    alt: string;
    objectFit?: "cover" | "contain";
    width?: number;
    height?: number;
  }
>(({ className, src, alt, objectFit = "contain", ...props }, ref) => (
  <div className="relative w-full h-full">
    <Image
      ref={ref}
      fill={true}
      src={src}
      alt={alt}
      objectFit={objectFit}
      className={cn("w-full h-full", className)}
      {...props}
    />
  </div>
));

ResponsiveImage.displayName = "ResponsiveImage";

export { ResponsiveImage };
