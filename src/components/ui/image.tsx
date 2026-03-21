import { cn } from "@/lib/utils";
import NextImage, { ImageLoader } from "next/image";
import React from "react";

export type ImageProps = React.DetailedHTMLProps<
  React.ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
> & {
  src: string;
  alt: string;
  loader?: ImageLoader;
  quality?: number;
  priority?: boolean;
  unoptimized?: boolean;
  objectFit?: React.CSSProperties["objectFit"];
  objectPosition?: string;
  placeholder?: "blur" | "empty" | `data:image/${string}`;
  blurDataURL?: string;
  layout?: "fill" | "fixed" | "intrinsic" | "responsive";
};

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt,
      loader,
      quality,
      priority,
      unoptimized,
      objectFit,
      objectPosition,
      placeholder,
      blurDataURL,
      layout,
      width,
      height,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("relative", className)}>
        <NextImage
          src={src}
          alt={alt}
          loader={loader}
          quality={quality}
          priority={priority}
          unoptimized={unoptimized}
          objectFit={objectFit}
          objectPosition={objectPosition}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          layout={layout}
          fill
          {...props}
          ref={ref}
        />
      </div>
    );
  }
);

export default Image;

Image.displayName = "Image";
