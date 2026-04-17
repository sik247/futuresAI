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
import { useStore } from "zustand";
import { withdrawStore } from "@/lib/stores/withdraw-store";
import { useRouter } from "next/navigation";
import { createWithdrawal } from "./actions";

type TWithdrawalApplicationModal = {};

const WithdrawalApplicationModal = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TWithdrawalApplicationModal
>((props, ref) => {
  const {
    tradeIds,
    setTradeIds,
    amount,
    setAmount,
    exchangeAccountIds,
    setExchangeAccountIds,
  } = useStore(withdrawStore);

  const [network, setNetwork] = React.useState<string>("");
  const [address, setAddress] = React.useState<string>("");
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const router = useRouter();

  async function onSubmit() {
    if (submitting) return;
    setErrorMsg(null);
    const trimmedAddress = address.trim();
    if (!network || !trimmedAddress) {
      setErrorMsg("네트워크와 지갑주소를 입력해주세요.");
      return;
    }
    if (tradeIds.length === 0 || exchangeAccountIds.length === 0 || amount <= 0) {
      setErrorMsg("환급받을 항목을 먼저 선택해주세요.");
      return;
    }
    if (network === "TRC20" && !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmedAddress)) {
      setErrorMsg("유효한 TRC20 지갑주소를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await createWithdrawal(
        amount,
        tradeIds,
        exchangeAccountIds,
        network,
        trimmedAddress
      );
      alert("출금 신청이 완료되었습니다.");
      setTradeIds([]);
      setAmount(0);
      setExchangeAccountIds([]);
      setNetwork("");
      setAddress("");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      const raw = String(err?.message || err || "");
      if (raw.toLowerCase().includes("unauthor") || raw.includes("NEXT_REDIRECT")) {
        setErrorMsg("세션이 만료되었습니다. 다시 로그인해주세요.");
      } else if (raw.includes("ownership") || raw.includes("권한")) {
        setErrorMsg("선택한 내역에 대한 권한이 없습니다. 페이지를 새로고침해주세요.");
      } else {
        setErrorMsg(`출금 신청에 실패했습니다. ${raw ? `(${raw.slice(0, 120)})` : "잠시 후 다시 시도해주세요."}`);
      }
      console.error("[Withdrawal] failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setErrorMsg(null); }}>
      <DialogTrigger asChild>
        <Button className="py-5 w-full bg-foreground text-background text-base font-bold rounded-full">
          출금 신청하기
        </Button>
      </DialogTrigger>
      <DialogContent className="md:max-w-[425px] max-md:w-[90%] p-6">
        <DialogHeader>
          <DialogTitle>출금 신청</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4">
          <div className="flex justify-between items-center px-1 text-xs text-muted-foreground">
            <span>신청 금액</span>
            <span className="font-mono font-semibold text-foreground">{amount.toLocaleString()} USDT</span>
          </div>
          <div className="grid grid-cols-1 items-center gap-4">
            <Label htmlFor="name" className="text-left text-sm font-bold">
              네트워크
            </Label>
            <Select
              value={network}
              onValueChange={(value) => {
                setNetwork(value);
              }}
            >
              <SelectTrigger className="w-full text-muted-foreground">
                <SelectValue placeholder="네트워크를 선택해주세요." />
              </SelectTrigger>
              <SelectContent className="h-1/2">
                <SelectGroup>
                  <SelectItem value="TRC20">TRC20</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 items-center gap-4">
            <Label htmlFor="address" className="text-left text-sm font-bold">
              지갑주소
            </Label>
            <Input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
              }}
              id="address"
              placeholder="지갑주소를 입력해주세요."
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
            {submitting ? "신청 중..." : "출금 신청"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

WithdrawalApplicationModal.displayName = "WithdrawalApplicationModal";

export { WithdrawalApplicationModal };
