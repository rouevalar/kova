"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, disabled, children, className, style, ...props },
  ref
) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 hover:scale-95 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100";

  const variants: Record<string, string> = {
    primary: "text-[#F4F3EE]",
    secondary: "text-[#B1ADA1] hover:text-[#F4F3EE]",
    ghost: "text-[#B1ADA1] hover:text-[#F4F3EE]",
    danger: "text-white",
  };

  const inlineStyles: Record<string, React.CSSProperties> = {
    primary: { background: "#C15F3C" },
    secondary: { border: "1px solid #2E2620", background: "transparent" },
    ghost: { background: "transparent" },
    danger: { background: "#EF4444" },
  };

  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };

  return (
    <button
      ref={ref}
      {...props}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      style={{ ...inlineStyles[variant], ...style }}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
});
