"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Building2, User, Upload, X, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

type AccountType = "individual" | "organization";
type Step = "type" | "details" | "done";

interface Props {
  walletAddress: string;
  onComplete: () => void;
}

export function OnboardingModal({ walletAddress, onComplete }: Props) {
  const [step, setStep] = useState<Step>("type");
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.url);
    } catch (err) {
      toast.error("Image upload failed. Try again.");
      setAvatarPreview("");
      setAvatarUrl("");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error(accountType === "organization" ? "Enter your organization name" : "Enter your name");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: walletAddress,
          displayName: displayName.trim(),
          bio: bio.trim() || null,
          avatarUrl: avatarUrl || null,
          accountType,
        }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      setStep("done");
      setTimeout(onComplete, 1200);
    } catch {
      toast.error("Could not save profile. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all";
  const inputStyle: React.CSSProperties = {
    background: "#161210",
    border: "1px solid #2E2620",
    color: "#F4F3EE",
    fontFamily: "Space Grotesk, sans-serif",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "#0E0B09", border: "1px solid #2E2620" }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6" style={{ borderBottom: "1px solid #2E2620" }}>
          <div className="flex items-center gap-3 mb-1">
            <Image src="/logo.svg" alt="Kova" width={24} height={24} />
            <span
              className="tracking-[-0.03em]"
              style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1rem", color: "#F4F3EE" }}
            >
              kova
            </span>
          </div>
          <h2
            className="text-2xl font-extrabold tracking-tight mt-4"
            style={{ fontFamily: "Syne, sans-serif", color: "#F4F3EE" }}
          >
            {step === "type" && "Welcome."}
            {step === "details" && "Tell us about yourself."}
            {step === "done" && "You're set."}
          </h2>
          <p className="text-sm mt-1" style={{ color: "#7A7269" }}>
            {step === "type" && "How are you using Kova?"}
            {step === "details" && "This is how others will see you."}
            {step === "done" && "Your profile has been saved."}
          </p>
        </div>

        <div className="px-8 py-6">
          {step === "type" && (
            <div className="space-y-3">
              {(["individual", "organization"] as AccountType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setAccountType(type)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                  style={
                    accountType === type
                      ? { background: "rgba(193,95,60,0.1)", border: "1px solid rgba(193,95,60,0.4)" }
                      : { background: "#161210", border: "1px solid #2E2620" }
                  }
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: accountType === type ? "rgba(193,95,60,0.15)" : "#1E1916",
                    }}
                  >
                    {type === "individual"
                      ? <User size={18} style={{ color: accountType === type ? "#C15F3C" : "#7A7269" }} />
                      : <Building2 size={18} style={{ color: accountType === type ? "#C15F3C" : "#7A7269" }} />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#F4F3EE" }}>
                      {type === "individual" ? "Individual" : "Organization / NGO"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#7A7269" }}>
                      {type === "individual"
                        ? "I'm raising funds for myself or a personal cause."
                        : "I represent a nonprofit, charity, or community group."}
                    </p>
                  </div>
                  <div
                    className="ml-auto w-4 h-4 rounded-full border-2 shrink-0 transition-all"
                    style={{
                      borderColor: accountType === type ? "#C15F3C" : "#2E2620",
                      background: accountType === type ? "#C15F3C" : "transparent",
                    }}
                  />
                </button>
              ))}

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-4 gap-2"
                onClick={() => setStep("details")}
              >
                Continue <ArrowRight size={16} />
              </Button>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 transition-all hover:opacity-80"
                  style={{ background: "#161210", border: "1px solid #2E2620" }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {uploading
                        ? <Loader2 size={18} className="animate-spin" style={{ color: "#C15F3C" }} />
                        : <Upload size={18} style={{ color: "#7A7269" }} />
                      }
                    </div>
                  )}
                </button>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#F4F3EE" }}>Profile photo</p>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-xs mt-0.5 transition-opacity hover:opacity-70"
                    style={{ color: "#C15F3C" }}
                  >
                    {avatarPreview ? "Change photo" : "Upload photo"}
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#B1ADA1" }}>
                  {accountType === "organization" ? "Organization name *" : "Your name *"}
                </label>
                <input
                  type="text"
                  placeholder={accountType === "organization" ? "Greenfield Foundation" : "Alex Chen"}
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#C15F3C")}
                  onBlur={e => (e.target.style.borderColor = "#2E2620")}
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#B1ADA1" }}>
                  Short bio <span style={{ color: "#7A7269" }}>(optional)</span>
                </label>
                <textarea
                  placeholder={
                    accountType === "organization"
                      ? "What your organization does and who it serves."
                      : "A sentence or two about yourself."
                  }
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  maxLength={280}
                  className={`${inputClass} resize-none`}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#C15F3C")}
                  onBlur={e => (e.target.style.borderColor = "#2E2620")}
                />
                <p className="text-xs mt-1 text-right" style={{ color: "#7A7269" }}>{bio.length}/280</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("type")}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:scale-95"
                  style={{ border: "1px solid #2E2620", color: "#B1ADA1" }}
                >
                  Back
                </button>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  loading={saving || uploading}
                  onClick={handleSave}
                >
                  Save profile
                </Button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(193,95,60,0.15)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#C15F3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: "#B1ADA1" }}>
                Taking you in...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
