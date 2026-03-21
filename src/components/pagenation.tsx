"use client";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

type TPagiNation = {
  dataLength: number;
};

const PagiNation: React.FC<TPagiNation> = ({ dataLength }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const pageSize = 10;
  const pageParams = searchParams.get("page") ?? "1";
  const router = useRouter();
  const maxPage =
    dataLength / pageSize <= 1 ? 1 : Math.ceil(dataLength / pageSize);
  console.log(maxPage);
  const params = new URLSearchParams(searchParams);

  function getPreviousButtonColor() {
    if (pageParams === "1") {
      return " text-slate-200";
    } else {
      return "text-neutral-900";
    }
  }

  function getNextButtonColor() {
    if (pageParams === maxPage.toString()) {
      return " text-slate-200";
    } else {
      return "text-neutral-900";
    }
  }

  function getNowPageColor(page: number) {
    if (pageParams === page.toString()) {
      return "text-slate-500";
    } else {
      return "text-slate-200";
    }
  }

  function gotoPreviousPage() {
    if (pageParams === "1") {
      return null;
    } else {
      return parseInt(pageParams!) - 1;
    }
  }

  function gotoNextPage() {
    if (pageParams === maxPage.toString()) {
      return null;
    } else {
      return parseInt(pageParams!) + 1;
    }
  }
  const currentPage = parseInt(pageParams!);
  const pages = Array.from({ length: maxPage }, (_, i) => i + 1);
  const pageChunks = [];
  for (let i = 0; i < pages.length; i += 10) {
    pageChunks.push(pages.slice(i, i + 10));
  }
  const currentChunk = pageChunks.find((chunk) => chunk.includes(currentPage));

  return (
    <Pagination className="my-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            className={getPreviousButtonColor() + " max-md:px-1"}
            onClick={() => {
              if (gotoPreviousPage() !== null) {
                params.set("page", gotoPreviousPage()!.toString());
                // window.location.href = pathname + "?" + params;
                router.push(pathname + "?" + params);
              }
            }}
          />
        </PaginationItem>
        {currentChunk!.map((i) => (
          <PaginationItem
            className="border rounded-md flex flex-col items-center justify-center h-9 w-9 max-md:h-7 max-md:w-7"
            key={i}
          >
            <PaginationLink
              className={getNowPageColor(i)}
              onClick={() => {
                params.set("page", i.toString());
                router.push(pathname + "?" + params);
              }}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            className={getNextButtonColor() + " max-md:px-1"}
            onClick={() => {
              if (gotoNextPage() !== null) {
                params.set("page", gotoNextPage()!.toString());
                router.push(pathname + "?" + params);
              }
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PagiNation;
