"use client";

import { usePathname, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";  // Adjust according to the folder structure
import { useEffect, useState } from "react";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const switchLanguage = () => {
    const currentLang = pathname.split('/')[1];
    const newLang = currentLang === 'en' ? 'ko' : 'en';
    const newPathname = pathname.replace(`/${currentLang}`, `/${newLang}`);
    router.push(newPathname);
  };

  // Don't render anything until mounted
  if (!mounted) {
    return <Button variant="ghost" size="sm" className="px-3">Loading...</Button>;
  }

  return (
    <Button 
      onClick={switchLanguage}
      variant="ghost"
      size="sm"
      className="px-3"
    >
      {pathname.startsWith('/ko') ? 'English' : '한국어'}
    </Button>
  );
}
export default LanguageSwitcher;