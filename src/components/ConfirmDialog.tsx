"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Lightweight in-app confirmation dialog. Centres a small card over a dimmed
 * backdrop; tapping the backdrop or pressing Escape dismisses. Intended for
 * quick destructive confirmations that feel native inside the phone frame.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    confirmRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
    >
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        tabIndex={-1}
        className="absolute inset-0 bg-black/60 cursor-default"
      />
      <div className="relative bg-surface border border-border/60 rounded-2xl shadow-2xl w-full max-w-[320px] p-5">
        <h2
          id="confirm-dialog-title"
          className="font-semibold text-foreground text-[16px] leading-tight"
        >
          {title}
        </h2>
        {message && (
          <p className="text-muted text-[13px] mt-2 leading-relaxed">
            {message}
          </p>
        )}
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-full bg-foreground/5 text-foreground text-[14px] font-medium active:opacity-80 transition-opacity"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-full text-[14px] font-medium active:opacity-80 transition-opacity ${
              destructive
                ? "bg-[#F87171]/15 text-[#F87171]"
                : "bg-primary text-[var(--app-primary-on)]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
