"use client";

import {
  IAlertDialogData,
  alertDialogStore,
  defaultAlertDialogData,
} from "@/lib/stores/alert-dialog-store";
import { useStore } from "zustand";

export function useAlertDialog(data: Partial<IAlertDialogData>) {
  const { setOpen, setData, setDefaultData } = useStore(alertDialogStore);
  const currentData: IAlertDialogData = { ...defaultAlertDialogData, ...data };

  return {
    open: (newData?: Partial<IAlertDialogData>) => {
      const mergedData = { ...currentData, ...newData };
      setData(mergedData);
      setOpen(true);
    },
    close: () => {
      setOpen(false);
      setDefaultData();
    },
  };
}
