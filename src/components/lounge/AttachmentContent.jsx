import React from "react";
import { Paperclip } from "lucide-react";

export default function AttachmentContent({ message, url }) {
  const type = message.message_type;
  if (type === "audio") {
    return url ? <audio controls src={url} className="h-8 w-44 sm:w-52" /> : <span className="text-xs italic opacity-60">🎤 …</span>;
  }
  if (type === "file") {
    if (!url) return <span className="text-xs italic opacity-60">📎 …</span>;
    if (message.file_mime?.startsWith("image/")) {
      return <img src={url} alt={message.file_name || "file"} className="max-h-40 max-w-full rounded-lg" />;
    }
    return (
      <a href={url} download={message.file_name || true} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm underline">
        <Paperclip className="h-4 w-4 shrink-0" />
        <span className="max-w-[160px] truncate">{message.file_name || "File"}</span>
      </a>
    );
  }
  return <span>{message.message_text}</span>;
}
