"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Exchange } from "@prisma/client";
import { createExchangeAccount } from "./actions";
import { useRouter, useParams } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { CheckCircle2, Loader2 } from "lucide-react";

type TAddExchangeModal = {
  exchanges: Exchange[];
};

const AddExchangeModal = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TAddExchangeModal
>(({ exchanges }, ref) => {
  const params = useParams<{ lang?: string }>();
  const ko = params?.lang !== "en";
  const [selectedExchange, setSelectedExchange] = React.useState<string>("");
  const [uid, setUid] = React.useState<string>("");
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const router = useRouter();

  function resetForm() {
    setUid("");
    setSelectedExchange("");
    setErrorMsg(null);
    setSuccess(false);
  }

  function messageForCode(
    code: Exclude<Awaited<ReturnType<typeof createExchangeAccount>>, { ok: true }>["code"],
  ): string {
    switch (code) {
      case "unauthorized":
        return ko ? "세션이 만료되었습니다. 다시 로그인해주세요." : "Session expired. Please sign in again.";
      case "missing_fields":
        return ko ? "거래소와 UID를 모두 입력해주세요." : "Please select an exchange and enter your UID.";
      case "exchange_already_linked":
        return ko ? "이미 해당 거래소를 연동하셨습니다." : "You have already linked this exchange.";
      case "uid_taken_same_user":
        return ko
          ? "이 UID는 이미 다른 거래소에 등록되어 있습니다."
          : "This UID is already linked to another exchange on your account.";
      case "uid_taken_by_other_user":
        return ko
          ? "이 UID는 다른 계정에 등록되어 있습니다. 본인 UID가 맞다면 고객센터(텔레그램)로 문의해주세요."
          : "This UID is already registered to another account. If it's yours, please contact support on Telegram.";
      case "exchange_not_found":
        return ko ? "선택한 거래소를 찾을 수 없습니다. 페이지를 새로고침 해주세요." : "Selected exchange was not found. Please refresh the page.";
      case "unknown":
      default:
        return ko ? "거래소 추가 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." : "Could not add exchange. Please try again shortly.";
    }
  }

  async function onSubmit() {
    if (submitting || success) return;
    setErrorMsg(null);
    if (!selectedExchange || !uid) {
      setErrorMsg(ko ? "거래소와 UID를 모두 입력해주세요." : "Please select an exchange and enter your UID.");
      return;
    }
    if (exchanges.length === 0) {
      setErrorMsg(ko ? "현재 선택 가능한 거래소가 없습니다. 관리자에게 문의해주세요." : "No exchanges available right now. Please contact support.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createExchangeAccount(selectedExchange, uid.trim());
      if (!result.ok) {
        const msg = messageForCode(result.code);
        setErrorMsg(msg);
        toast({
          variant: "destructive",
          title: ko ? "등록 실패" : "Submission failed",
          description: msg,
        });
        return;
      }
      setSuccess(true);
      toast({
        title: ko ? "UID 등록 완료" : "UID submitted",
        description: ko ? "관리자 승인 후 페이백 추적이 시작됩니다." : "Payback tracking starts after admin approval.",
      });
      router.refresh();
      // Brief in-modal success state so the user sees confirmation before dismissal.
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 1500);
    } catch (err: any) {
      // Network / serialization failure — the action itself returns errors
      // structurally, so reaching this branch is unexpected.
      console.error("[AddExchange] transport failure:", err);
      const msg = ko
        ? "네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요."
        : "Network error. Check your connection and try again.";
      setErrorMsg(msg);
      toast({
        variant: "destructive",
        title: ko ? "등록 실패" : "Submission failed",
        description: msg,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="py-5 w-full bg-background text-foreground border-foreground text-base font-bold rounded-full"
        >
          {ko ? "거래소 추가하기" : "Add exchange"}
        </Button>
      </DialogTrigger>
      <DialogContent className="md:max-w-[425px] max-md:w-[90%] p-6">
        <DialogHeader>
          <DialogTitle>{ko ? "거래소 추가" : "Add exchange"}</DialogTitle>
        </DialogHeader>
        {success ? (
          <div className="py-10 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" aria-hidden />
            <p className="text-base font-semibold">
              {ko ? "UID 등록 완료 — 심사 대기 중" : "UID submitted — pending review"}
            </p>
            <p className="text-sm text-muted-foreground">
              {ko ? "승인되면 페이백 추적이 자동으로 시작됩니다." : "Payback tracking starts automatically once approved."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 py-4">
              <div className="grid grid-cols-1 items-center gap-4">
                <Label htmlFor="name" className="text-left text-sm font-bold">
                  {ko ? "거래소" : "Exchange"}
                </Label>
                <Select
                  value={selectedExchange}
                  onValueChange={(value) => setSelectedExchange(value)}
                >
                  <SelectTrigger className="w-full text-muted-foreground">
                    <SelectValue
                      placeholder={
                        exchanges.length === 0
                          ? ko
                            ? "사용 가능한 거래소가 없습니다"
                            : "No exchanges available"
                          : ko
                          ? "거래소를 선택해주세요."
                          : "Select an exchange"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="h-1/2">
                    <SelectGroup>
                      {exchanges.map((exchange) => (
                        <SelectItem key={exchange.id} value={exchange.id}>
                          {exchange.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 items-center gap-4">
                <Label htmlFor="uid" className="text-left text-sm font-bold">
                  UID
                </Label>
                <Input
                  id="uid"
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder={ko ? "거래소 UID를 입력해주세요." : "Enter your exchange UID"}
                  className="w-full"
                />
              </div>
              {errorMsg && (
                <p className="text-sm font-medium text-red-500 bg-red-50 border border-red-200 rounded-md p-2">
                  {errorMsg}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={onSubmit}
                type="submit"
                disabled={submitting}
                className="rounded-full bg-foreground text-background w-full text-base font-bold disabled:opacity-60"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {ko ? "추가 중..." : "Submitting..."}
                  </span>
                ) : (
                  <span>{ko ? "거래소 추가" : "Add exchange"}</span>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
});

AddExchangeModal.displayName = "AddExchangeModal";

export { AddExchangeModal };
