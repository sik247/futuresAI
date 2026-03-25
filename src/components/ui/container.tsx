// components/ui/container.tsx
import { cn } from "@/lib/utils";
import React from "react";

type TContainer = {
  children: React.ReactNode;
  className?: string;
};

const Container: React.FC<TContainer> = ({ children, className }) => {
  return (
    <div className="flex justify-center w-full px-6">
      <div className={cn("max-w-7xl w-full inner-wrap", className)}>
        {children}
      </div>
    </div>
  );
};

export default Container;
