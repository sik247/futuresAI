"use client";
import { useAlertDialog } from "@/components/ui/use-alert-dialog";

export function useAction<T extends (...args: Parameters<T>) => ReturnType<T>>(
  action: T
) {
  const { open } = useAlertDialog({
    title: "에러",
    description: "알 수 없는 에러가 발생했습니다.",
    confirm: "확인",
    cancel: "취소",
    onCancel: () => {},
    onConfirm: () => {},
  });
  return (...args: Parameters<T>) => {
    try {
      const response = action(...args);
      return response;
    } catch (e) {
      if (e instanceof Error) {
        open({
          description: e.message,
        });
        return;
      }
      open();
    }
  };
}
