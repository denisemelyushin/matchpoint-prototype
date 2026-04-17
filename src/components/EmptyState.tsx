import { PlusIcon } from "./icons";

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
      <div className="w-14 h-14 rounded-full bg-surface-light flex items-center justify-center">
        <PlusIcon size={22} color="var(--color-muted)" />
      </div>
      <p className="text-muted text-sm">{text}</p>
    </div>
  );
}
