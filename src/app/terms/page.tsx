"use client";

import { AppHeader } from "@/components/AppHeader";

export default function TermsPage() {
  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader title="Terms of Use" />
      <div className="flex-1 overflow-y-auto px-5 py-6 text-foreground text-[15px] leading-relaxed space-y-4">
        <p>
          This is a prototype built for demonstration purposes. Use it to
          explore features and flows.
        </p>
        <p>
          The production Terms of Use will describe acceptable use, community
          guidelines, and the rights and obligations of Matchpoint and its
          users.
        </p>
      </div>
    </div>
  );
}
