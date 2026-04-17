"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  MapPinIcon,
  CalendarIcon,
  MessageCircleIcon,
  ShareIcon,
  UserIcon,
} from "@/components/icons";

const STEPS = [
  {
    icon: MapPinIcon,
    title: "Find Courts Near You",
    description:
      "Discover nearby pickleball courts and see where others are playing.",
  },
  {
    icon: CalendarIcon,
    title: "Schedule & Join Games",
    description: "Create games or join open matches in your area.",
  },
  {
    icon: MessageCircleIcon,
    title: "Stay Connected with Players",
    description: "Message players and coordinate games easily.",
  },
  {
    icon: ShareIcon,
    title: "Share the Game",
    description:
      "Post your games and see your friends playing on the social feed.",
  },
  {
    icon: UserIcon,
    title: "Let's Get You on the Court!",
    description: "Create your profile.",
  },
];

const SWIPE_THRESHOLD_RATIO = 0.18;
const SWIPE_THRESHOLD_MAX_PX = 80;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [frameWidth, setFrameWidth] = useState(0);

  const frameRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const lockedAxisRef = useRef<"x" | "y" | null>(null);

  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setFrameWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      router.push("/feed");
    }
  }, [currentStep, router]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    lockedAxisRef.current = null;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null || startYRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    if (!lockedAxisRef.current) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      lockedAxisRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }

    if (lockedAxisRef.current !== "x") return;

    let offset = dx;
    if (
      (currentStep === 0 && offset > 0) ||
      (currentStep === STEPS.length - 1 && offset < 0)
    ) {
      offset *= 0.3;
    }
    setDragOffset(offset);
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    const axis = lockedAxisRef.current;
    startXRef.current = null;
    startYRef.current = null;
    lockedAxisRef.current = null;
    setIsDragging(false);
    setDragOffset(0);

    if (axis !== "x") return;

    const threshold = Math.min(
      SWIPE_THRESHOLD_MAX_PX,
      (frameWidth || 1) * SWIPE_THRESHOLD_RATIO
    );
    if (dx < -threshold && currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else if (dx > threshold && currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const translatePx = -currentStep * frameWidth + dragOffset;
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="flex flex-col h-full overflow-hidden overscroll-none bg-background">
      <div
        ref={frameRef}
        className="flex-1 overflow-hidden touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className={`flex h-full ${
            isDragging
              ? ""
              : "transition-transform duration-300 ease-out"
          }`}
          style={{
            width: frameWidth ? frameWidth * STEPS.length : undefined,
            transform: `translate3d(${translatePx}px, 0, 0)`,
          }}
        >
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="h-full shrink-0 flex flex-col items-center justify-center px-8"
                style={{ width: frameWidth || undefined }}
              >
                <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Icon size={56} color="#96FE17" />
                </div>
                <h2 className="text-2xl font-bold text-foreground text-center leading-tight mb-3">
                  {s.title}
                </h2>
                <p className="text-muted text-center text-base max-w-[280px] leading-relaxed">
                  {s.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-8 pb-8">
        <div className="flex justify-center gap-2 mb-5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? "w-8 bg-primary"
                  : i < currentStep
                  ? "w-2 bg-primary/40"
                  : "w-2 bg-border"
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full max-w-[320px] mx-auto block py-4 rounded-2xl bg-primary text-background font-semibold text-lg active:scale-[0.97] transition-transform"
        >
          {isLast ? "Let's Go!" : "Next"}
        </button>
      </div>
    </div>
  );
}
