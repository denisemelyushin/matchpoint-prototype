"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app-store";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { SearchIcon } from "@/components/icons";

export default function NewChatPage() {
  const router = useRouter();
  const { users, currentUserId, startOrGetChat } = useAppStore();
  const [query, setQuery] = useState("");

  const candidates = useMemo(
    () => users.filter((u) => u.id !== currentUserId),
    [users, currentUserId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [candidates, query]);

  const handleSelect = (userId: string) => {
    const chatId = startOrGetChat(userId);
    router.replace(`/chat/${chatId}`);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader title="New Message" />

      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2.5">
          <SearchIcon size={18} color="var(--color-muted)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none text-[15px]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted text-sm">
            No players match your search.
          </div>
        ) : (
          filtered.map((u) => (
            <button
              key={u.id}
              onClick={() => handleSelect(u.id)}
              className="w-full flex items-center gap-3 px-4 py-3 active:bg-surface-light transition-colors text-left"
            >
              <Avatar name={u.name} initials={u.initials} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-[15px] truncate">
                  {u.name}
                </p>
                <p className="text-muted text-xs truncate">{u.email}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
