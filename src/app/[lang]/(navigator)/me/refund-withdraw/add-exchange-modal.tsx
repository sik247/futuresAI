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
  const router = useRouter();

  function onSubmit() {
    if (!selectedExchange || !uid) {
      alert("거래소와 UID를 입력해주세요.");
      return;
    }
    createExchangeAccount(selectedExchange, uid).then(() => {
      alert("거래소가 추가되었습니다.");
      setUid("");
      setSelectedExchange("");
      router.refresh();
    });
  }

  return (
    <Dialog>
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
                <SelectValue placeholder="거래소를 선택해주세요." />
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
        </div>
        <DialogFooter>
          <Button
            onClick={onSubmit}
            type="submit"
            className="rounded-full bg-foreground text-background w-full text-base font-bold"
          >
            거래소 추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

AddExchangeModal.displayName = "AddExchangeModal";

export { AddExchangeModal };
