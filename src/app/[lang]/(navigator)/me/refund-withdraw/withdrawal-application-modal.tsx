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

  const router = useRouter();

  function onSubmit() {
    if (!network || !address) {
      alert("네트워크와 지갑주소를 입력해주세요.");
      return;
    }

    createWithdrawal(
      amount,
      tradeIds,
      exchangeAccountIds,
      network,
      address
    ).then(() => {
      alert("출금 신청이 완료되었습니다.");
      setTradeIds([]);
      setAmount(0);
      setExchangeAccountIds([]);
      setNetwork("");
      setAddress("");
      router.refresh();
    });
  }

  return (
    <Dialog>
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
        </div>
        <DialogFooter>
          <Button
            onClick={onSubmit}
            type="submit"
            className="rounded-full bg-foreground text-background w-full text-base font-bold"
          >
            출금 신청
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

WithdrawalApplicationModal.displayName = "WithdrawalApplicationModal";

export { WithdrawalApplicationModal };
