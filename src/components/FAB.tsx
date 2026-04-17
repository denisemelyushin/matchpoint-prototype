"use client";

import { PlusIcon } from "./icons";

interface FABProps {
  onClick: () => void;
  label?: string;
}

export function FAB({ onClick, label = "Create" }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="absolute bottom-20 right-5 w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center active:scale-90 transition-transform z-20"
      style={{ boxShadow: "0 8px 24px rgba(150, 254, 23, 0.35)" }}
    >
      <PlusIcon size={26} color="#0A0A0A" />
    </button>
  );
}
