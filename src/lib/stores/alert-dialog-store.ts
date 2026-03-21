"use client";

import { create } from "zustand";

interface IAlertDialogStore {
  open: boolean;
  setOpen: (open: boolean) => void;
  data: IAlertDialogData;
  setData: (data: IAlertDialogData) => void;
  setDefaultData: () => void;
}

export interface IAlertDialogData {
  title: string;
  description: string;
  confirm: string;
  cancel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const defaultAlertDialogData: IAlertDialogData = {
  title: "",
  description: "",
  confirm: "확인",
  cancel: "취소",
  onConfirm: () => {},
  onCancel: () => {},
};

export const alertDialogStore = create<IAlertDialogStore>((set) => {
  return {
    open: false,
    setOpen: (open: boolean) => set({ open }),
    data: defaultAlertDialogData,
    setData: (data: IAlertDialogData) => set({ data }),
    setDefaultData: () => set({ data: defaultAlertDialogData }),
  };
});
