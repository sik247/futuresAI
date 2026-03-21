"use client";

import React from "react";
import Spinner from "./spinner";
import { loadingStore } from "@/lib/stores/loading-store";
import { useStore } from "zustand";

const Loading: React.FC = () => {
  const store = useStore(loadingStore);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!store.loading) return setLoading(false);
    const timer = setTimeout(() => {
      setLoading(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [store.loading]);

  if (!loading) return null;

  return (
    <div
      tabIndex={-1}
      className="fixed left-0 right-0 top-0 z-50 flex h-screen w-full cursor-wait items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 transition-all md:inset-0 md:h-full"
    >
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-2"
      >
        <Spinner />
      </div>
    </div>
  );
};

export default Loading;
