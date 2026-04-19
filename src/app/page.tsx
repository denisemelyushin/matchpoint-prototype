"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/**
 * The root route is now a pure auth-gate redirect:
 *   - signed-in users land on `/feed`
 *   - guests (including freshly signed-out users) land on `/onboarding`,
 *     whose first slide is the branded "welcome" screen with the
 *     Get Started CTA.
 *
 * We render nothing visible here — the next screen takes over almost
 * immediately.
 */
export default function RootRedirectPage() {
  const router = useRouter();
  const { currentUserId, isAuthenticating } = useAuth();

  useEffect(() => {
    if (isAuthenticating) return;
    router.replace(currentUserId ? "/feed" : "/onboarding");
  }, [isAuthenticating, currentUserId, router]);

  return <div className="h-full bg-background" aria-hidden />;
}
