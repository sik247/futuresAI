"use client";

import { create } from "zustand";

interface ILoadingStore {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const loadingStore = create<ILoadingStore>((set) => {
  return {
    loading: false,
    setLoading: (loading: boolean) => set({ loading }),
  };
});
