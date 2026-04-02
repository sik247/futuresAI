// components/logo.tsx
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Logo: React.FC = () => {
  return (
    <Link href="/" className="flex items-center flex-shrink-0">
      <div className="w-24 md:w-28 lg:w-32 h-auto overflow-hidden">
        <Image
          src="/images/futuresai-logo.jpeg"
          alt="FuturesAI"
          width={1179}
          height={355}
          className="w-full h-auto rounded"
          priority
        />
      </div>
    </Link>
  );
};

export default Logo;
