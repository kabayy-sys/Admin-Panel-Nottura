"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({
  value,
  label = "Teks",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} disalin ke clipboard`);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Gagal menyalin ke clipboard");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      title={`Salin ${label}`}
      aria-label={`Salin ${label}`}
      className={`inline-flex items-center justify-center rounded-md p-1 text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#17171D] transition cursor-pointer ${className}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[#22C55E]" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
