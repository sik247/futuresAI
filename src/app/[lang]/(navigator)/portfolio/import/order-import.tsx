"use client";

export default function OrderImport({ lang }: { lang: string }) {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-24 sm:pt-28 pb-24">
      <h1 className="text-2xl font-bold text-zinc-100 mb-4">
        {lang === "ko" ? "주문 내역 가져오기" : "Import Orders"}
      </h1>
      <p className="text-zinc-500">
        {lang === "ko"
          ? "스크린샷 또는 CSV/Excel 파일로 거래소 주문 내역을 가져올 수 있습니다."
          : "Import your exchange orders via screenshot or CSV/Excel upload."}
      </p>
      <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.03] p-12 text-center">
        <p className="text-zinc-400 text-sm">
          {lang === "ko" ? "곧 출시됩니다" : "Coming soon"}
        </p>
      </div>
    </div>
  );
}
