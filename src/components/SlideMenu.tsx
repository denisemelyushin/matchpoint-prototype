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
  ChevronRightIcon,
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
        className={`absolute top-0 left-0 bottom-0 w-[290px] bg-surface z-50 transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 pt-14 border-b border-border relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 active:scale-90 transition-transform"
            aria-label="Close menu"
          >
            <XIcon size={20} color="#888" />
          </button>

          <button
            onClick={() => go("/profile")}
            className="flex items-center gap-3 w-full text-left active:opacity-80 transition-opacity"
          >
            <Avatar
              name={currentUser.name}
              initials={currentUser.initials}
              size={56}
            />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground text-base truncate">
                {currentUser.name}
              </p>
              <p className="text-muted text-sm truncate">
                {currentUser.email}
              </p>
            </div>
          </button>

          <button
            onClick={() => go("/profile/edit")}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary font-medium text-sm active:scale-[0.98] transition-transform"
          >
            <EditIcon size={16} color="#96FE17" />
            Edit Profile
          </button>
        </div>

        <div className="flex-1 py-2">
          <button
            onClick={() => go("/privacy")}
            className="flex items-center gap-4 w-full px-6 py-4 active:bg-surface-light transition-colors"
          >
            <ShieldIcon size={20} color="#888" />
            <span className="flex-1 text-foreground text-[15px] text-left">
              Privacy Policy
            </span>
            <ChevronRightIcon size={16} color="#555" />
          </button>

          <button
            onClick={() => go("/terms")}
            className="flex items-center gap-4 w-full px-6 py-4 active:bg-surface-light transition-colors"
          >
            <FileTextIcon size={20} color="#888" />
            <span className="flex-1 text-foreground text-[15px] text-left">
              Terms of Use
            </span>
            <ChevronRightIcon size={16} color="#555" />
          </button>
        </div>

        <div className="border-t border-border p-4 pb-8 space-y-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-2 py-3 rounded-xl active:bg-surface-light transition-colors"
          >
            <LogOutIcon size={20} color="#888" />
            <span className="text-foreground text-[15px]">Log Out</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="flex items-center gap-4 w-full px-2 py-3 rounded-xl active:bg-surface-light transition-colors"
          >
            <TrashIcon size={20} color="#FF4757" />
            <span className="text-[#FF4757] text-[15px]">Delete Account</span>
          </button>
        </div>
      </div>
    </>
  );
}
