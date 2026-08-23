import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileText, Download, Trash2, Paperclip } from "lucide-react";

export default function FilesSection({ inquiry, onUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [removingIdx, setRemovingIdx] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const files = inquiry.files || [];

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newFiles = [...files, { name: file.name, url: file_url }];
      const updated = await base44.entities.CateringInquiry.update(inquiry.id, { files: newFiles });
      onUpdated(updated);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeFile = async (idx) => {
    setRemovingIdx(idx);
    try {
      const newFiles = files.filter((_, i) => i !== idx);
      const updated = await base44.entities.CateringInquiry.update(inquiry.id, { files: newFiles });
      onUpdated(updated);
    } catch (err) {
      setError(err.message || "Could not remove file");
    } finally {
      setRemovingIdx(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Paperclip className="w-4 h-4 text-zinc-500" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Event Files</h3>
        <span className="ml-auto text-xs text-zinc-500">{files.length} {files.length === 1 ? "file" : "files"}</span>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
        <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 px-4 py-4 cursor-pointer hover:border-amber-500/50 hover:bg-zinc-800/50 transition">
          <input ref={inputRef} type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
          {uploading ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Upload className="w-4 h-4 text-zinc-400" />}
          <span className="text-sm text-zinc-300">{uploading ? "Uploading…" : "Upload document"}</span>
        </label>
        {error && <div className="text-sm text-rose-400">{error}</div>}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-2.5">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <a href={f.url} target="_blank" rel="noreferrer" download className="text-sm text-zinc-200 truncate hover:text-amber-300 flex-1">{f.name}</a>
                <a href={f.url} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white"><Download className="w-3.5 h-3.5" /></a>
                <button onClick={() => removeFile(idx)} disabled={removingIdx === idx} className="text-zinc-400 hover:text-rose-400 disabled:opacity-50">
                  {removingIdx === idx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}