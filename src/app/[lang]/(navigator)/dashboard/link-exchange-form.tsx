"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { FileUploadModule } from "@/lib/modules/file-upload";
import { getImageUrl } from "@/lib/utils/get-image-url";
import { linkExchangeAccount } from "./payback-actions";

type Props = {
  exchanges: { id: string; name: string; imageUrl: string }[];
  lang: string;
};

export default function LinkExchangeForm({ exchanges, lang }: Props) {
  const ko = lang === "ko";
  const [open, setOpen] = useState(false);
  const [selectedExchangeId, setSelectedExchangeId] = useState("");
  const [uid, setUid] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setScreenshotFile(file);
    if (file) {
      setScreenshotPreview(URL.createObjectURL(file));
    } else {
      setScreenshotPreview(null);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    if (file && file.type.startsWith("image/")) {
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  }

  function resetForm() {
    setSelectedExchangeId("");
    setUid("");
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (!selectedExchangeId) {
      setResult({ error: ko ? "거래소를 선택해주세요" : "Please select an exchange" });
      return;
    }
    if (!uid.trim() || uid.trim().length < 2) {
      setResult({ error: ko ? "유효한 UID를 입력해주세요" : "Please enter a valid UID" });
      return;
    }

    setLoading(true);
    try {
      let screenshotUrl = "";
      if (screenshotFile) {
        const uploader = new FileUploadModule();
        const uploadData = await uploader.upload(screenshotFile);
        screenshotUrl = getImageUrl(uploadData.path);
      }

      const res = await linkExchangeAccount({
        exchangeId: selectedExchangeId,
        uid: uid.trim(),
        screenshotUrl,
      });

      setResult(res);
      if (res.success) {
        resetForm();
        setTimeout(() => setOpen(false), 2000);
      }
    } catch {
      setResult({ error: ko ? "오류가 발생했습니다" : "An error occurred" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6">
      {!open ? (
        <button
          onClick={() => { setOpen(true); setResult(null); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-900/30"
        >
          <span>+</span>
          {ko ? "거래소 계정 연결" : "Link Exchange Account"}
        </button>
      ) : (
        <Card className="p-6 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">
              {ko ? "거래소 계정 연결" : "Link Exchange Account"}
            </h2>
            <button
              onClick={() => { setOpen(false); resetForm(); }}
              className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
            >
              {ko ? "닫기" : "Close"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Exchange selector */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em] mb-2">
                {ko ? "거래소" : "Exchange"}
              </label>
              <div className="flex flex-wrap gap-2">
                {exchanges.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => setSelectedExchangeId(ex.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                      selectedExchangeId === ex.id
                        ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                        : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:border-white/[0.16] hover:text-zinc-200"
                    }`}
                  >
                    {ex.imageUrl && (
                      <Image
                        src={getImageUrl(ex.imageUrl)}
                        alt={ex.name}
                        width={18}
                        height={18}
                        className="rounded-sm object-contain"
                        unoptimized
                      />
                    )}
                    {ex.name}
                  </button>
                ))}
              </div>
            </div>

            {/* UID input */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em] mb-2">
                UID
              </label>
              <input
                type="text"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder={ko ? "거래소 UID를 입력하세요" : "Enter your exchange UID"}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
              />
            </div>

            {/* Screenshot upload */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em] mb-2">
                {ko ? "스크린샷 (선택)" : "Screenshot (optional)"}
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.2] transition-all cursor-pointer"
              >
                {screenshotPreview ? (
                  <div className="relative p-3 flex justify-center">
                    <Image
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      width={320}
                      height={180}
                      className="rounded-lg object-contain max-h-40"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setScreenshotFile(null);
                        setScreenshotPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-4 right-4 w-6 h-6 rounded-full bg-black/60 text-zinc-300 hover:text-white text-xs flex items-center justify-center"
                    >
                      x
                    </button>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center gap-2">
                    <p className="text-sm text-zinc-500">
                      {ko ? "파일을 드래그하거나 클릭하여 업로드" : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-xs text-zinc-700">PNG, JPG, WEBP</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Result message */}
            {result && (
              <div
                className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  result.success
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}
              >
                {result.success
                  ? ko
                    ? "계정이 성공적으로 연결되었습니다. 검토 후 승인됩니다."
                    : "Account linked successfully. It will be reviewed and approved shortly."
                  : result.error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-900/20"
            >
              {loading
                ? ko ? "처리 중..." : "Processing..."
                : ko ? "계정 연결 신청" : "Submit Account Link"}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
