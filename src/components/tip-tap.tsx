"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
// import Bold from "@tiptap/extension-bold";
// import Underline from "@tiptap/extension-underline";
// import Italic from "@tiptap/extension-italic";
// import Image from "@tiptap/extension-image";
// import Highlight from "@tiptap/extension-highlight";
import {
  BaselineIcon,
  BoldIcon,
  HighlighterIcon,
  ImagePlusIcon,
  ItalicIcon,
  SmilePlus,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import Image from "@tiptap/extension-image";
// import { FileUploader } from "@/lib/server/file-upload/file-uploader";
// import Loading from "./loading";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { richTextStore } from "@/lib/stores/rich-text-store";
import { FileUploadModule } from "@/lib/modules/file-upload";
import { SUPABASE_STORAGE_URL } from "@/lib/utils/get-image-url";
import Loading from "./ui/loading";
// import { emoticons } from "@/lib/constants/emoticons";

// import TextStyle from "@tiptap/extension-text-style";
// import { Color } from "@tiptap/extension-color";
// import { CirclePicker } from "react-color";
// import { FontSize } from "@/utils/tiptap-fontsize";

const Tiptap: React.FC<{
  isComment?: boolean;
  isNotice?: boolean;
}> = ({ isComment = false, isNotice = false }) => {
  const [imageLoading, setImageLoading] = useState(false);
  const { richText, setRichText, insertText, updateRichText } = richTextStore();

  const colors = [
    "#131313",
    "#6b6b6b",
    // red
    "#FF3333",
    "#FF6666",
    // orange
    "#FF9933",
    // yellow
    "#ffe600",
    // green
    "#33FF33",
    "#33FF99",
    // blue
    "#3333FF",
    "#3399FF",
    // purple
    "#9933FF",
    "#FF33FF",
  ];

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
          style: "color: blue; text-decoration: underline;",
        },
      }),
      // Bold,
      // Underline,
      // Italic,
      Image,
      // TextStyle,
      // Color,
      // Highlight.configure({
      //   multicolor: true,
      // }),
      // FontSize,
    ],
    editorProps: {
      attributes: {
        spellcheck: "false",
      },
    },
  });

  const fontSizes = ["Small", "Medium", "Large"];

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("multiple", "multiple");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = async () => {
      setImageLoading(true);
      const fileList = input.files;
      if (!fileList) return setImageLoading(false);
      let totalImgHtml = "";
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        // let compressedFile = await imageCompression(file, options);
        let compressedFile = file;
        // compress image unless it is gif, webp
        if (
          file.type !== "image/gif" &&
          file.type !== "image/webp" &&
          !isNotice
        ) {
          compressedFile = await imageCompression(file, options);
        }
        const fileUploader = new FileUploadModule();
        const data = await fileUploader.upload(compressedFile);

        totalImgHtml =
          totalImgHtml +
          `<img src="${SUPABASE_STORAGE_URL}${data.path}" alt="image"/>`;
      }
      // updateRichText(totalImgHtml + "<br/>");
      editor
        ?.chain()
        .focus()
        .insertContent(totalImgHtml + "<br/>")
        .run();

      setImageLoading(false);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.on("update", () => {
      setRichText(editor.getHTML());
    });
  }, [imageLoading, editor]);
  useEffect(() => {
    if (!editor) return;
    if (richText !== editor.getHTML()) editor.commands.setContent(richText);
  }, [richText, editor]);

  useEffect(() => {
    if (!editor) return;

    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      let totalImgHtml = "";
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) continue;

          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          let compressedFile = file;
          if (
            file.type !== "image/gif" &&
            file.type !== "image/webp" &&
            !isNotice
          ) {
            compressedFile = await imageCompression(file, options);
          }
          const fileUploader = new FileUploadModule();
          const data = await fileUploader.upload(compressedFile);

          totalImgHtml += `<img src="${SUPABASE_STORAGE_URL}${data.path}" alt="image"/>`;
        }
      }

      if (totalImgHtml) {
        editor
          ?.chain()
          .focus()
          .insertContent(totalImgHtml + "<br/>")
          .run();
      }
    };

    editor.view.dom.addEventListener("paste", handlePaste);

    return () => {
      editor.view.dom.removeEventListener("paste", handlePaste);
    };
  }, [editor, isNotice]);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;

    const handleDrop = async (event: DragEvent) => {
      event.preventDefault();
      const files = event.dataTransfer?.files;
      if (!files) return;

      let totalImgHtml = "";
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith("image/")) {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          let compressedFile = file;
          if (
            file.type !== "image/gif" &&
            file.type !== "image/webp" &&
            !isNotice
          ) {
            compressedFile = await imageCompression(file, options);
          }
          const fileUploader = new FileUploadModule();
          const data = await fileUploader.upload(compressedFile);

          totalImgHtml += `<img src="${SUPABASE_STORAGE_URL}${data.path}" alt="image"/>`;
        }
      }

      if (totalImgHtml) {
        editor
          ?.chain()
          .focus()
          .insertContent(totalImgHtml + "<br/>")
          .run();
      }
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
    };

    const editorDom = editorRef.current;
    editorDom?.addEventListener("drop", handleDrop);
    editorDom?.addEventListener("dragover", handleDragOver);

    return () => {
      editorDom?.removeEventListener("drop", handleDrop);
      editorDom?.removeEventListener("dragover", handleDragOver);
    };
  }, [editor, isNotice]);

  return (
    <>
      {imageLoading && <Loading />}
      <div className="w-full border shadow-sm rounded-md flex flex-col">
        <div className="p-4 w-full flex gap-4 border-b items-center overflow-x-scroll overflow-y-hidden no-scrollbar">
          {/* <Select
            defaultValue="Medium"
            value={
              editor?.getAttributes("textStyle")?.fontSize === "12px"
                ? "Small"
                : editor?.getAttributes("textStyle")?.fontSize === "24px"
                ? "Large"
                : "Medium"
            }
            onValueChange={(value) => onFontSizeChange(value)}
          >
            <SelectTrigger className="w-fit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontSizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}
          {/* <button
            onClick={(e) => {
              e.preventDefault();
              editor?.chain().focus().toggleBold().run();
            }}
          >
            <BoldIcon
              width={16}
              height={16}
              color={`${editor?.isActive("bold") ? "blue" : "black"}`}
            />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              editor?.chain().focus().toggleItalic().run();
            }}
          >
            <ItalicIcon
              width={16}
              height={16}
              color={`${editor?.isActive("italic") ? "blue" : "black"}`}
            />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              editor?.chain().focus().toggleUnderline().run();
            }}
          >
            <UnderlineIcon
              width={16}
              height={16}
              color={`${editor?.isActive("underline") ? "blue" : "black"}`}
            />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              editor?.chain().focus().toggleStrike().run();
            }}
          >
            <StrikethroughIcon
              width={16}
              height={16}
              color={`${editor?.isActive("strike") ? "blue" : "black"}`}
            />
          </button>
          <Dialog>
            <DialogContent className="sm:max-w-[425px] flex flex-col justify-center items-center gap-4">
              <DialogHeader className="text-lg font-bold">
                글 색상 선택
              </DialogHeader>
              <CirclePicker
                colors={colors}
                color={editor?.getAttributes("textStyle")?.color}
                onChange={(color) => {
                  editor?.chain().focus().setColor(color.hex).run();
                }}
              />
            </DialogContent>
            <DialogTrigger>
              <BaselineIcon width={16} height={16} />
            </DialogTrigger>
          </Dialog>
          <Dialog>
            <DialogContent className="sm:max-w-[425px] flex flex-col justify-center items-center gap-4">
              <DialogHeader className="text-lg font-bold">
                글 배경 색상 선택
              </DialogHeader>
              <CirclePicker
                colors={colors}
                color={editor?.getAttributes("highlight")?.color}
                onChange={(color) => {
                  editor?.commands.setHighlight({
                    color: color.hex,
                  });
                }}
              />
              <button
                onClick={() => {
                  editor?.chain().focus().unsetHighlight().run();
                }}
                className="p-2 rounded-md bg-red-500 text-white"
              >
                <span>초기화</span>
              </button>
            </DialogContent>
            <DialogTrigger>
              <HighlighterIcon width={16} height={16} />
            </DialogTrigger>
          </Dialog> */}
          <button
            onClick={(e) => {
              e.preventDefault();
              addImage();
            }}
          >
            <ImagePlusIcon width={16} height={16} />
          </button>
          {/* <Dialog>
            <DialogContent className="sm:max-w-[425px]">
              <ScrollArea
                className={` ${
                  isComment ? "h-[200px]" : "h-[500px]"
                } flex flex-col gap-2`}
              >
                <div className="flex flex-col gap-2">
                  {emoticons.map((emoticon, index) => (
                    <DialogClose
                      key={index}
                      className="cursor-pointer flex space-y-2"
                      onClick={() => {
                        syncRichText(emoticon);
                      }}
                    >
                      <div className="w-full space-y-2 flex justify-start text-neutral-500">
                        <span className="p-2 rounded-md border border-neutral-500">
                          {emoticon}
                        </span>
                      </div>
                    </DialogClose>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
            <DialogTrigger>
              <SmilePlus size={16} />
            </DialogTrigger>
          </Dialog> */}
        </div>
        <div
          ref={editorRef}
          className={`w-full h-full ${
            !isComment ? "min-h-[500px]" : "min-h-[200px]"
          } p-4 `}
          onClick={() => {
            if (editor?.isFocused) return;
            editor?.commands.focus();
          }}
        >
          <EditorContent
            editor={editor}
            className=" appearance-none focus:outline-none outline-none"
          />
        </div>
      </div>
    </>
  );
};

export default Tiptap;
