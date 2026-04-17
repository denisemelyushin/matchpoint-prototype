"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "./icons";
import type { ReactNode } from "react";

interface AppHeaderProps {
  title: string;
  right?: ReactNode;
  onBack?: () => void;
}

export function AppHeader({ title, right, onBack }: AppHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="flex items-center justify-between px-2 pt-12 pb-3 bg-background/90 backdrop-blur-xl sticky top-0 z-30 border-b border-border/60">
      <button
        onClick={handleBack}
        className="p-2 active:scale-90 transition-transform"
        aria-label="Back"
      >
        <ChevronLeftIcon size={24} color="var(--color-foreground)" />
      </button>

      <h1 className="flex-1 text-center text-lg font-bold text-foreground truncate px-2">
        {title}
      </h1>

      <div className="min-w-[40px] flex justify-end pr-2">{right}</div>
    </div>
  );
}
