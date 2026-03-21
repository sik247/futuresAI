import {
  DocumentChartBarIcon,
  DocumentIcon,
  DocumentTextIcon,
  PaperClipIcon,
  PhotoIcon,
  PresentationChartBarIcon,
  VideoCameraIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import React from "react";

type TFileCard = {
  file: File;
  onDelete?: () => void;
};
const FileCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TFileCard
>(({ file, onDelete }, ref) => {
  function formatFileSize(size: number): string {
    if (size >= 1073741824) {
      return (size / 1073741824).toFixed(2) + " GB";
    } else if (size >= 1048576) {
      return (size / 1048576).toFixed(2) + " MB";
    } else if (size >= 1024) {
      return (size / 1024).toFixed(2) + " KB";
    } else {
      return size + " bytes";
    }
  }
  return (
    <div className="flex w-full items-center justify-between p-4 border rounded-md">
      <div className="flex items-center gap-4  w-[70%] max-md:gap-2">
        <FileIcon type={file.type} />
        <div className=" max-md:text-xs break-words whitespace-pre-line text-ellipsis overflow-hidden">
          {file.name}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm font-medium">
          {formatFileSize(file.size)}
        </span>
        <button onClick={onDelete}>
          <XMarkIcon className="w-4 h-4 text-muted-foreground cursor-pointer" />
        </button>
      </div>
    </div>
  );
});

FileCard.displayName = "FileCard";

export default FileCard;

type TFileIcon = {
  type: string;
};

const FileIcon: React.FC<TFileIcon> = ({ type }) => {
  if (type.includes("image")) {
    return <PhotoIcon className="w-6 h-6 text-muted-foreground " />;
  } else if (type.includes("pdf")) {
    return <DocumentIcon className="w-6 h-6 text-muted-foreground" />;
  } else if (type.includes("word")) {
    return <DocumentTextIcon className="w-6 h-6 text-muted-foreground" />;
  } else if (type.includes("excel")) {
    return <DocumentChartBarIcon className="w-6 h-6 text-muted-foreground" />;
  } else if (type.includes("powerpoint")) {
    return (
      <PresentationChartBarIcon className="w-6 h-6 text-muted-foreground" />
    );
  } else if (type.includes("video")) {
    return <VideoCameraIcon className="w-6 h-6 text-muted-foreground" />;
  }
  return <PaperClipIcon className="w-6 h-6 text-muted-foreground" />;
};
