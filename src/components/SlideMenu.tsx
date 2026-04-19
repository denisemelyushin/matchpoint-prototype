"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth";
import { MenuProfileCard } from "./MenuProfileCard";
import {
  ShieldIcon,
  FileTextIcon,
  LogInIcon,
  LogOutIcon,
  SlidersIcon,
  UserIcon,
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
  const { signOut, openAuthModal } = useAuth();

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleLogout = async () => {
    onClose();
    try {
      await signOut();
    } catch (err) {
      console.error("[menu] sign out failed:", err);
    }
    // After signing out, land the user on the welcome/onboarding flow
    // (the first onboarding slide is the branded welcome screen).
    router.replace("/onboarding");
  };

  const handleSignIn = () => {
    onClose();
    openAuthModal();
  };

  return (
    <aside
      aria-hidden={!isOpen}
      className="absolute top-0 left-0 bottom-0 z-0 w-[300px] flex flex-col pt-12 bg-background"
    >
      <div className="px-5">
        {currentUser ? (
          <MenuProfileCard
            name={currentUser.name}
            email={currentUser.email}
            initials={currentUser.initials}
            onEdit={() => go("/profile/edit")}
            tabIndex={isOpen ? 0 : -1}
          />
        ) : (
          <button
            type="button"
            onClick={handleSignIn}
            tabIndex={isOpen ? 0 : -1}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl bg-surface border border-border/60 active:opacity-80 transition-opacity text-left"
          >
            <div className="w-11 h-11 rounded-full bg-surface-light flex items-center justify-center">
              <UserIcon size={20} color="var(--color-muted)" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-semibold text-[17px] leading-tight">
                Guest
              </p>
              <p className="text-muted text-[13px] leading-tight mt-0.5">
                Sign in to get started
              </p>
            </div>
          </button>
        )}
      </div>

      <div className="flex-1 px-3 pt-4">
        <button
          onClick={() => go("/settings")}
          className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl active:bg-foreground/5 transition-colors"
          tabIndex={isOpen ? 0 : -1}
        >
          <SlidersIcon size={22} color="var(--color-muted)" />
          <span className="flex-1 text-foreground text-[16px] text-left">
            Settings
          </span>
        </button>

        <button
          onClick={() => go("/privacy")}
          className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl active:bg-foreground/5 transition-colors"
          tabIndex={isOpen ? 0 : -1}
        >
          <ShieldIcon size={22} color="var(--color-muted)" />
          <span className="flex-1 text-foreground text-[16px] text-left">
            Privacy Policy
          </span>
        </button>

        <button
          onClick={() => go("/terms")}
          className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl active:bg-foreground/5 transition-colors"
          tabIndex={isOpen ? 0 : -1}
        >
          <FileTextIcon size={22} color="var(--color-muted)" />
          <span className="flex-1 text-foreground text-[16px] text-left">
            Terms of Use
          </span>
        </button>
      </div>

      <div className="p-3 pb-6">
        {currentUser ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl active:bg-foreground/5 transition-colors"
            tabIndex={isOpen ? 0 : -1}
          >
            <LogOutIcon size={22} color="var(--color-muted)" />
            <span className="text-foreground text-[16px]">Log Out</span>
          </button>
        ) : (
          <button
            onClick={handleSignIn}
            className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl active:bg-foreground/5 transition-colors"
            tabIndex={isOpen ? 0 : -1}
          >
            <LogInIcon size={22} color="var(--color-muted)" />
            <span className="text-foreground text-[16px]">Sign In</span>
          </button>
        )}
      </div>
    </aside>
  );
}
