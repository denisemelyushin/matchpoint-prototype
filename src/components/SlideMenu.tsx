"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "./Avatar";
import {
  XIcon,
  UserIcon,
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

const MENU_ITEMS = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "privacy", label: "Privacy Policy", icon: ShieldIcon, isLink: true },
  { id: "terms", label: "Terms of Use", icon: FileTextIcon, isLink: true },
];

export function SlideMenu({ isOpen, onClose }: SlideMenuProps) {
  const router = useRouter();

  const handleLogout = () => {
    onClose();
    router.push("/");
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      onClose();
      router.push("/");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        className={`absolute top-0 left-0 bottom-0 w-[280px] bg-surface z-50 transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 pt-14 border-b border-border">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 active:scale-90 transition-transform"
          >
            <XIcon size={20} color="#888" />
          </button>

          <div className="flex items-center gap-3">
            <Avatar name="You" initials="YO" size={52} />
            <div>
              <p className="font-bold text-foreground text-lg">Your Name</p>
              <p className="text-muted text-sm">@yourprofile</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 py-2">
          {MENU_ITEMS.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={onClose}
                className="flex items-center gap-4 w-full px-6 py-4 active:bg-surface-light transition-colors"
              >
                <IconComponent size={20} color="#888" />
                <span className="flex-1 text-foreground text-[15px] text-left">
                  {item.label}
                </span>
                <ChevronRightIcon size={16} color="#555" />
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
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
