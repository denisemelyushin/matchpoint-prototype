"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app-store";
import { MenuProfileCard } from "./MenuProfileCard";
import {
  ShieldIcon,
  FileTextIcon,
  LogOutIcon,
  SlidersIcon,
} from "./icons";

interface SlideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Slide-out menu that sits on a layer beneath the main app shell. The menu
 * itself is stationary (anchored to the left edge of the phone frame); it
 * becomes visible when the main shell slides to the right to reveal it.
 */
export function SlideMenu({ isOpen, onClose }: SlideMenuProps) {
  const router = useRouter();
  const { currentUser } = useAppStore();

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleLogout = () => {
    onClose();
    router.push("/");
  };

  return (
    <aside
      aria-hidden={!isOpen}
      className="absolute top-0 left-0 bottom-0 z-0 w-[280px] flex flex-col pt-12 bg-background"
    >
      <div className="px-5">
        <MenuProfileCard
          name={currentUser.name}
          email={currentUser.email}
          initials={currentUser.initials}
          onEdit={() => go("/profile/edit")}
          tabIndex={isOpen ? 0 : -1}
        />
      </div>

      <div className="flex-1 px-3 pt-3">
        <button
          onClick={() => go("/settings")}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl active:bg-foreground/5 transition-colors"
          tabIndex={isOpen ? 0 : -1}
        >
          <SlidersIcon size={18} color="var(--color-muted)" />
          <span className="flex-1 text-foreground text-[14px] text-left">
            Settings
          </span>
        </button>

        <button
          onClick={() => go("/privacy")}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl active:bg-foreground/5 transition-colors"
          tabIndex={isOpen ? 0 : -1}
        >
          <ShieldIcon size={18} color="var(--color-muted)" />
          <span className="flex-1 text-foreground text-[14px] text-left">
            Privacy Policy
          </span>
        </button>

        <button
          onClick={() => go("/terms")}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl active:bg-foreground/5 transition-colors"
          tabIndex={isOpen ? 0 : -1}
        >
          <FileTextIcon size={18} color="var(--color-muted)" />
          <span className="flex-1 text-foreground text-[14px] text-left">
            Terms of Use
          </span>
        </button>
      </div>

      <div className="p-3 pb-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl active:bg-foreground/5 transition-colors"
          tabIndex={isOpen ? 0 : -1}
        >
          <LogOutIcon size={18} color="var(--color-muted)" />
          <span className="text-foreground text-[14px]">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
