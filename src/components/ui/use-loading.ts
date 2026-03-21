"use client";

import { loadingStore } from "@/lib/stores/loading-store";
import { useStore } from "zustand";

export function useLoading() {
  const store = useStore(loadingStore);

  return {
    trigger: () => store.setLoading(true),
    stop: () => store.setLoading(false),
  };
}
