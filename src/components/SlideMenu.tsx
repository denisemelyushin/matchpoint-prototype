"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app-store";
import { Avatar } from "./Avatar";
import {
  XIcon,
  EditIcon,
  ShieldIcon,
  FileTextIcon,
  LogOutIcon,
  TrashIcon,
} from "./icons";

interface SlideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

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

  const handleDeleteAccount = () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      onClose();
      router.push("/");
    }
  };

  return (
    <>
      <div
        className={`absolute inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute top-0 left-0 bottom-0 w-[300px] bg-surface z-50 transition-transform duration-300 ease-out flex flex-col rounded-tr-3xl rounded-br-3xl overflow-hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 pt-12 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full active:bg-white/5 transition-colors"
            aria-label="Close menu"
          >
            <XIcon size={18} color="#888" />
          </button>

          <div className="bg-surface-light rounded-2xl p-4">
            <button
              onClick={() => go("/profile")}
              className="flex items-center gap-3 w-full text-left active:opacity-80 transition-opacity"
            >
              <Avatar
                name={currentUser.name}
                initials={currentUser.initials}
                size={52}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-[15px] truncate">
                  {currentUser.name}
                </p>
                <p className="text-muted text-xs truncate mt-0.5">
                  {currentUser.email}
                </p>
              </div>
            </button>

            <button
              onClick={() => go("/profile/edit")}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 text-primary font-medium text-[13px] active:scale-[0.98] transition-transform"
            >
              <EditIcon size={14} color="#96FE17" />
              Edit Profile
            </button>
          </div>
        </div>

        <div className="flex-1 px-3">
          <button
            onClick={() => go("/privacy")}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl active:bg-white/5 transition-colors"
          >
            <ShieldIcon size={18} color="#888" />
            <span className="flex-1 text-foreground text-[14px] text-left">
              Privacy Policy
            </span>
          </button>

          <button
            onClick={() => go("/terms")}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl active:bg-white/5 transition-colors"
          >
            <FileTextIcon size={18} color="#888" />
            <span className="flex-1 text-foreground text-[14px] text-left">
              Terms of Use
            </span>
          </button>
        </div>

        <div className="p-3 pb-6 space-y-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl active:bg-white/5 transition-colors"
          >
            <LogOutIcon size={18} color="#888" />
            <span className="text-foreground text-[14px]">Log Out</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl bg-[#FF4757]/5 active:bg-[#FF4757]/10 transition-colors"
          >
            <TrashIcon size={18} color="#FF4757" />
            <span className="text-[#FF4757] text-[14px] font-medium">
              Delete Account
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
