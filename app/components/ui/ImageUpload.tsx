"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspectRatio?: "banner" | "square";
  optional?: boolean;
}

export function ImageUpload({ value, onChange, label = "Image", aspectRatio = "banner", optional = true }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
      setPreview(data.url);
    } catch {
      toast.error("Image upload failed");
      setPreview(value);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview("");
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const isBanner = aspectRatio === "banner";

  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: "#B1ADA1" }}>
        {label} {optional && <span style={{ color: "#7A7269" }}>(optional)</span>}
      </label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="relative rounded-xl overflow-hidden cursor-pointer transition-all group"
        style={{
          background: "#161210",
          border: `1px dashed ${preview ? "#2E2620" : "#3A332E"}`,
          aspectRatio: isBanner ? "16/5" : "1/1",
          minHeight: isBanner ? "120px" : "80px",
          maxWidth: isBanner ? "100%" : "160px",
        }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
                <Loader2 size={24} className="animate-spin" style={{ color: "#C15F3C" }} />
              </div>
            )}
            {!uploading && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.4)" }}>
                <p className="text-xs font-medium" style={{ color: "#F4F3EE" }}>Click to replace</p>
              </div>
            )}
            <button
              onClick={clear}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              <X size={13} style={{ color: "#F4F3EE" }} />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {uploading
              ? <Loader2 size={22} className="animate-spin" style={{ color: "#C15F3C" }} />
              : <Upload size={22} style={{ color: "#7A7269" }} />
            }
            {!uploading && (
              <p className="text-xs text-center px-4" style={{ color: "#7A7269" }}>
                Click or drag to upload
                <br />
                <span style={{ color: "#3A332E" }}>JPG, PNG, WebP — max 5MB</span>
              </p>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
