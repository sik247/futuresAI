"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUploader from "@/components/file-uploader";
import Tiptap from "@/components/tip-tap";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUploadModule } from "@/lib/modules/file-upload";
import { richTextStore } from "@/lib/stores/rich-text-store";
import { SUPABASE_STORAGE_URL } from "@/lib/utils/get-image-url";

const CATEGORIES = [
  { value: "guide", label: "Guide (가이드)" },
  { value: "research", label: "Research (리서치)" },
  { value: "news", label: "News (뉴스)" },
  { value: "general", label: "General (일반)" },
];

interface BlogFormProps {
  article?: {
    id: string;
    title: string;
    titleKo: string;
    content: string;
    contentKo: string;
    excerpt: string;
    excerptKo: string;
    imageUrl: string;
    category: string;
    tags: string[];
    published: boolean;
  };
}

export function BlogForm({ article }: BlogFormProps) {
  const router = useRouter();
  const { richText } = richTextStore();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(article?.title || "");
  const [titleKo, setTitleKo] = useState(article?.titleKo || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [excerptKo, setExcerptKo] = useState(article?.excerptKo || "");
  const [imageUrl, setImageUrl] = useState(article?.imageUrl || "");
  const [category, setCategory] = useState(article?.category || "guide");
  const [tagsInput, setTagsInput] = useState(article?.tags?.join(", ") || "");
  const [contentKo, setContentKo] = useState(article?.contentKo || "");
  const [useKoreanEditor, setUseKoreanEditor] = useState(false);

  async function handleSubmit(publish: boolean) {
    if (!title) {
      alert("제목을 입력해주세요 / Please enter a title");
      return;
    }

    setSaving(true);

    const content = useKoreanEditor ? contentKo : richText;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const body = {
      title,
      titleKo,
      content: useKoreanEditor ? article?.content || "" : content,
      contentKo: useKoreanEditor ? content : contentKo,
      excerpt,
      excerptKo,
      imageUrl,
      category,
      tags,
      published: publish,
    };

    try {
      const url = article ? `/api/blog/${article.id}` : "/api/blog";
      const method = article ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");

      alert(publish ? "게시되었습니다! / Published!" : "저장되었습니다 / Saved as draft");
      router.push("./");
      router.refresh();
    } catch {
      alert("저장에 실패했습니다 / Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Image upload */}
      <div>
        <label className="text-sm text-zinc-400 mb-2 block">
          Cover Image (커버 이미지)
        </label>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Cover"
            className="w-full h-48 object-cover rounded-xl mb-3"
          />
        )}
        <FileUploader
          labelText="커버 이미지를 업로드 해주세요"
          onChange={async (files) => {
            if (files.length < 1) return;
            const fileUploader = new FileUploadModule();
            const data = await fileUploader.upload(files[0]);
            setImageUrl(SUPABASE_STORAGE_URL + data.path);
          }}
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-sm text-zinc-400 mb-2 block">
          Category (카테고리)
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-zinc-900 border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Title (EN) */}
      <div>
        <label className="text-sm text-zinc-400 mb-2 block">
          Title (English)
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title in English"
          className="bg-zinc-900 border-white/[0.1]"
        />
      </div>

      {/* Title (KO) */}
      <div>
        <label className="text-sm text-zinc-400 mb-2 block">
          제목 (한국어)
        </label>
        <Input
          value={titleKo}
          onChange={(e) => setTitleKo(e.target.value)}
          placeholder="한국어 제목"
          className="bg-zinc-900 border-white/[0.1]"
        />
      </div>

      {/* Excerpt (EN) */}
      <div>
        <label className="text-sm text-zinc-400 mb-2 block">
          Excerpt / Summary (English)
        </label>
        <Input
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Brief summary for card preview"
          className="bg-zinc-900 border-white/[0.1]"
        />
      </div>

      {/* Excerpt (KO) */}
      <div>
        <label className="text-sm text-zinc-400 mb-2 block">
          요약 (한국어)
        </label>
        <Input
          value={excerptKo}
          onChange={(e) => setExcerptKo(e.target.value)}
          placeholder="카드 미리보기용 간단 요약"
          className="bg-zinc-900 border-white/[0.1]"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm text-zinc-400 mb-2 block">
          Tags (comma-separated)
        </label>
        <Input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="KYC, Bitget, guide, exchange"
          className="bg-zinc-900 border-white/[0.1]"
        />
      </div>

      {/* Language toggle for editor */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-zinc-400">Content editor language:</label>
        <button
          type="button"
          onClick={() => setUseKoreanEditor(false)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            !useKoreanEditor
              ? "bg-blue-600 text-white"
              : "bg-white/[0.06] text-zinc-400"
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setUseKoreanEditor(true)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            useKoreanEditor
              ? "bg-blue-600 text-white"
              : "bg-white/[0.06] text-zinc-400"
          }`}
        >
          한국어
        </button>
      </div>

      {/* Rich text editor */}
      <div>
        <label className="text-sm text-zinc-400 mb-2 block">
          {useKoreanEditor ? "본문 (한국어)" : "Content (English)"}
        </label>
        {useKoreanEditor ? (
          <textarea
            value={contentKo}
            onChange={(e) => setContentKo(e.target.value)}
            placeholder="한국어 본문을 입력해주세요 (HTML 지원)"
            rows={15}
            className="w-full bg-zinc-900 border border-white/[0.1] rounded-lg px-4 py-3 text-sm text-white font-mono resize-y"
          />
        ) : (
          <Tiptap />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
        <Button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={saving}
          variant="outline"
          className="bg-zinc-900 border-white/[0.1] text-zinc-300 hover:bg-zinc-800"
        >
          {saving ? "Saving..." : "Save as Draft (임시저장)"}
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          {saving ? "Publishing..." : "Publish (게시하기)"}
        </Button>
        <Button
          type="button"
          onClick={() => router.back()}
          variant="ghost"
          className="text-zinc-400 hover:text-zinc-200"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
