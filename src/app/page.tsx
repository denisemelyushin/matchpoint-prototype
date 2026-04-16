"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-between h-full bg-background px-8 py-16">
      <div className="flex-1" />

      <div className="flex flex-col items-center gap-5">
        <Image
          src="/logo.png"
          alt="Matchpoint"
          width={320}
          height={213}
          priority
          className="w-[280px] h-auto max-w-full"
        />
        <p className="text-muted text-center text-base max-w-[260px]">
          Find courts. Play games. Connect with players.
        </p>
      </div>

      <div className="flex-1" />

      <button
        onClick={() => router.push("/onboarding")}
        className="w-full max-w-[320px] py-4 rounded-2xl bg-primary text-background font-semibold text-lg active:scale-[0.97] transition-transform"
      >
        Get Started
      </button>

      <div className="h-8" />
    </div>
  );
}
