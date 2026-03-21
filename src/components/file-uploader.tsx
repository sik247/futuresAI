"use client";

import { cn } from "@/lib/utils";
import { ArrowUpTrayIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { toast } from "./ui/use-toast";
import FileCard from "./file-card";
import { Card } from "./ui/card";
import { FileUploadModule } from "@/lib/modules/file-upload";
import { set } from "date-fns";

type TFileUploader = {
  onChange?: (files: File[]) => void;
  labelText?: string;
  multiple?: boolean;
  accept?: string;
  initialFile?: string;
  onDeleted?: () => void;
};

const FileUploader: React.FC<TFileUploader> = ({
  labelText = "Upload Image",
  multiple = false,
  accept,
  onChange,
  initialFile,
  onDeleted,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [initialFileUrl, setInitialFileUrl] = useState<string | undefined>(
    initialFile
  );

  const dragRef = React.useRef<HTMLLabelElement>(null);

  useEffect(() => {
    if (!initialFile) return;
    setFiles([new File([], initialFile)]);
  }, []);

  const handleDragIn = useCallback((e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragOut = useCallback((e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer!.files) {
      setIsDragging(true);
    }
  }, []);

  const onChangeFiles = useCallback(
    (e: ChangeEvent<HTMLInputElement> | any): void => {
      let selectFiles: File[] = [];
      let tempFiles: File[] = files;

      if (e.type === "drop") {
        selectFiles = e.dataTransfer.files;
      } else {
        selectFiles = e.target.files;
      }

      if (selectFiles.length === 0) return;

      if (!multiple && files.length + selectFiles.length > 1) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You can only upload one file",
        });
        return;
      }

      for (const file of selectFiles) {
        tempFiles = [...tempFiles, file];
      }

      setFiles(tempFiles);
    },
    [files]
  );

  const handleDrop = useCallback(
    (e: DragEvent): void => {
      e.preventDefault();
      e.stopPropagation();

      onChangeFiles(e);
      setIsDragging(false);
    },
    [onChangeFiles]
  );

  const initDragEvents = useCallback((): void => {
    if (dragRef.current !== null) {
      dragRef.current.addEventListener("dragenter", handleDragIn);
      dragRef.current.addEventListener("dragleave", handleDragOut);
      dragRef.current.addEventListener("dragover", handleDragOver);
      dragRef.current.addEventListener("drop", handleDrop);
    }
  }, [handleDragIn, handleDragOut, handleDragOver, handleDrop]);

  const resetDragEvents = useCallback((): void => {
    if (dragRef.current !== null) {
      dragRef.current.removeEventListener("dragenter", handleDragIn);
      dragRef.current.removeEventListener("dragleave", handleDragOut);
      dragRef.current.removeEventListener("dragover", handleDragOver);
      dragRef.current.removeEventListener("drop", handleDrop);
    }
  }, [handleDragIn, handleDragOut, handleDragOver, handleDrop]);

  useEffect(() => {
    initDragEvents();

    return () => resetDragEvents();
  }, [initDragEvents, resetDragEvents]);

  useEffect(() => {
    if (onChange) onChange(files);
  }, [files]);

  return (
    <Card className="flex flex-col  w-full">
      <input
        type="file"
        id="file-upload"
        className="hidden"
        multiple={multiple}
        accept={accept}
        onChange={onChangeFiles}
      />
      <label
        ref={dragRef}
        htmlFor="file-upload"
        className={cn(
          "w-full  rounded-md text-muted-foreground font-medium flex flex-col items-center justify-center gap-4",
          isDragging ? "border-2 border-primary" : "",
          files.length > 0 ? "" : "p-12"
        )}
      >
        {files.length > 0 ? (
          //file image가 보이게
          <img
            src={initialFileUrl ?? URL.createObjectURL(files[0])}
            alt="favicon"
            className="w-[440px] h-[200px] object-fill"
          />
        ) : (
          <>
            <CloudArrowUpIcon className="w-8 h-8 text-muted-foreground" />
            {labelText}
            <span className=" text-muted-foreground">
              Max 10 MB files are allowed
            </span>
          </>
        )}
      </label>
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((file, i) => (
            <FileCard
              key={i}
              file={file}
              onDelete={() => {
                setFiles((prev) => prev.filter((f) => f.name !== file.name));
                setInitialFileUrl(undefined);
                onDeleted && onDeleted();
              }}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

export default FileUploader;
