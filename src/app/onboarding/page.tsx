"use client";

import { useState, useCallback } from "react";
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
    description:
      "Create games or join open matches in your area.",
  },
  {
    icon: MessageCircleIcon,
    title: "Stay Connected with Players",
    description:
      "Message players and coordinate games easily.",
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

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      router.push("/feed");
    }
  }, [currentStep, router]);

  const step = STEPS[currentStep];
  const IconComponent = step.icon;
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex justify-end p-4">
        {!isLast && (
          <button
            onClick={() => router.push("/feed")}
            className="text-muted text-sm px-3 py-1"
          >
            Skip
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center mb-10">
          <IconComponent size={56} color="#96FE17" />
        </div>

        <h2 className="text-2xl font-bold text-foreground text-center mb-4 leading-tight">
          {step.title}
        </h2>

        <p className="text-muted text-center text-base max-w-[280px] leading-relaxed">
          {step.description}
        </p>
      </div>

      <div className="px-8 pb-12">
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
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
          className="w-full py-4 rounded-2xl bg-primary text-background font-semibold text-lg active:scale-[0.97] transition-transform"
        >
          {isLast ? "Let's Go!" : "Next"}
        </button>
      </div>
    </div>
  );
}
