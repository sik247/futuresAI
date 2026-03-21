// components/logo.tsx
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Logo: React.FC = () => {
  return (
    <Link href="/" className="flex items-center">
      <div className="w-32 md:w-36 lg:w-40 h-auto">
        <Image
          src="/images/futures-ai-logo.png"
          alt="Futures & AI logo"
          width={160}
          height={40}
          className="w-full h-auto"
          priority
        />
      </div>
    </Link>
  );
};

export default Logo;
