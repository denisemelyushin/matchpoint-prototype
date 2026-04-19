"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function WelcomePage() {
  const router = useRouter();
  const { currentUserId, isAuthenticating } = useAuth();

  // If a signed-in user lands on "/", send them straight to the feed so the
  // welcome screen only shows to guests / first-time visitors.
  useEffect(() => {
    if (!isAuthenticating && currentUserId) {
      router.replace("/feed");
    }
  }, [isAuthenticating, currentUserId, router]);

  // Avoid a flash of the welcome screen while auth is restoring, and during
  // the brief moment after sign-in before the redirect runs.
  if (isAuthenticating || currentUserId) {
    return <div className="h-full bg-background" aria-hidden />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden overscroll-none bg-background px-8 touch-none">
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
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

      <div className="pb-8">
        <button
          onClick={() => router.push("/onboarding")}
          className="w-full max-w-[320px] mx-auto block py-4 rounded-2xl bg-primary text-[var(--app-primary-on)] font-semibold text-lg active:scale-[0.97] transition-transform"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
