"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

const POP_DURATION_MS = 240;
const POP_SAFETY_MS = 320;

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function animatePop(onDone: () => void): void {
  if (typeof document === "undefined" || reducedMotion()) {
    onDone();
    return;
  }
  const root = document.querySelector<HTMLElement>(".animate-push");
  if (!root) {
    onDone();
    return;
  }
  root.classList.remove("animate-push");
  root.classList.add("animate-pop");

  let fired = false;
  const run = () => {
    if (fired) return;
    fired = true;
    onDone();
  };
  root.addEventListener("animationend", run, { once: true });
  window.setTimeout(run, POP_SAFETY_MS);
}

export { POP_DURATION_MS };

export function useAnimatedRouter() {
  const router = useRouter();

  const back = useCallback(() => {
    animatePop(() => router.back());
  }, [router]);

  return { back };
}
