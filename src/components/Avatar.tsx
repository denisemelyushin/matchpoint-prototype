"use client";

import { getAvatarColor } from "@/lib/mock-data";

interface AvatarProps {
  name: string;
  initials: string;
  size?: number;
}

export function Avatar({ name, initials, size = 40 }: AvatarProps) {
  const bgColor = getAvatarColor(name);

  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold text-white shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  );
}
