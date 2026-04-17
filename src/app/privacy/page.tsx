"use client";

import { AppHeader } from "@/components/AppHeader";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col h-full bg-background animate-push">
      <AppHeader title="Privacy Policy" />
      <div className="flex-1 overflow-y-auto px-5 py-6 text-foreground text-[15px] leading-relaxed space-y-4">
        <p>
          This is a prototype. Your data is kept only in your browser memory and
          is not sent to any server.
        </p>
        <p>
          In the production version of Matchpoint, we will describe exactly
          which data we collect, how it is used, and how you can delete your
          account and data at any time.
        </p>
      </div>
    </div>
  );
}
