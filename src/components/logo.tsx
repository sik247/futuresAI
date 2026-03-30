// components/logo.tsx
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Logo: React.FC = () => {
  return (
    <Link href="/" className="flex items-center">
      <div className="w-28 md:w-32 lg:w-36 h-auto">
        <Image
          src="/images/futuresai-logo.svg"
          alt="FuturesAI"
          width={220}
          height={48}
          className="w-full h-auto"
          priority
        />
      </div>
    </Link>
  );
};

export default Logo;
