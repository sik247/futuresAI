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
import { useRouter } from "next/navigation";

type TAddExchangeModal = {
  exchanges: Exchange[];
};

const AddExchangeModal = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TAddExchangeModal
>(({ exchanges }, ref) => {
  const [selectedExchange, setSelectedExchange] = React.useState<string>("");
  const [uid, setUid] = React.useState<string>("");
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const router = useRouter();

  async function onSubmit() {
    if (submitting) return;
    setErrorMsg(null);
    if (!selectedExchange || !uid) {
      setErrorMsg("거래소와 UID를 모두 입력해주세요.");
      return;
    }
    if (exchanges.length === 0) {
      setErrorMsg("현재 선택 가능한 거래소가 없습니다. 관리자에게 문의해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await createExchangeAccount(selectedExchange, uid.trim());
      alert("거래소가 추가되었습니다.");
      setUid("");
      setSelectedExchange("");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      const raw = String(err?.message || err || "");
      if (raw.includes("Unique constraint") || raw.includes("P2002")) {
        setErrorMsg("이미 등록된 UID입니다. 다른 UID이거나, 이미 연동된 계정인지 확인해주세요.");
      } else if (raw.includes("NEXT_REDIRECT") || raw.toLowerCase().includes("unauthor")) {
        setErrorMsg("세션이 만료되었습니다. 다시 로그인해주세요.");
      } else {
        setErrorMsg(`거래소 추가에 실패했습니다. ${raw ? `(${raw.slice(0, 120)})` : "잠시 후 다시 시도해주세요."}`);
      }
      console.error("[AddExchange] failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setErrorMsg(null); }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="py-5 w-full bg-background text-foreground border-foreground text-base font-bold rounded-full"
        >
          거래소 추가하기
        </Button>
      </DialogTrigger>
      <DialogContent className="md:max-w-[425px] max-md:w-[90%] p-6">
        <DialogHeader>
          <DialogTitle>거래소 추가</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4">
          <div className="grid grid-cols-1 items-center gap-4">
            <Label htmlFor="name" className="text-left text-sm font-bold">
              거래소
            </Label>
            <Select
              value={selectedExchange}
              onValueChange={(value) => {
                setSelectedExchange(value);
              }}
            >
              <SelectTrigger className="w-full text-muted-foreground">
                <SelectValue placeholder={exchanges.length === 0 ? "사용 가능한 거래소가 없습니다" : "거래소를 선택해주세요."} />
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
              placeholder="거래소 UID를 입력해주세요."
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
            {submitting ? "추가 중..." : "거래소 추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

AddExchangeModal.displayName = "AddExchangeModal";

export { AddExchangeModal };
