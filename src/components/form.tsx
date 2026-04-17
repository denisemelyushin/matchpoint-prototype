"use client";

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { GlobeIcon, LockIcon } from "./icons";

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
}

export function FieldLabel({ children, htmlFor }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-muted text-xs font-medium uppercase tracking-wide mb-2"
    >
      {children}
    </label>
  );
}

export function TextInput(
  props: InputHTMLAttributes<HTMLInputElement>
) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors ${className}`}
    />
  );
}

export function TextArea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors resize-none ${className}`}
    />
  );
}

export function Select(
  props: SelectHTMLAttributes<HTMLSelectElement>
) {
  const { className = "", children, ...rest } = props;
  return (
    <div className="relative">
      <select
        {...rest}
        className={`w-full appearance-none px-4 py-3 pr-10 bg-surface border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/60 transition-colors ${className}`}
      >
        {children}
      </select>
      <svg
        className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-muted)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

interface PrivacyToggleProps {
  isPrivate: boolean;
  onChange: (isPrivate: boolean) => void;
}

export function PrivacyToggle({ isPrivate, onChange }: PrivacyToggleProps) {
  return (
    <div className="flex bg-surface border border-border rounded-xl p-1">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          !isPrivate
            ? "bg-primary text-[var(--app-primary-on)]"
            : "text-muted hover:text-foreground"
        }`}
      >
        <GlobeIcon
          size={16}
          color={!isPrivate ? "var(--app-primary-on)" : "var(--color-muted)"}
        />
        Public
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isPrivate
            ? "bg-primary text-[var(--app-primary-on)]"
            : "text-muted hover:text-foreground"
        }`}
      >
        <LockIcon size={16} color={isPrivate ? "var(--app-primary-on)" : "var(--color-muted)"} />
        Private
      </button>
    </div>
  );
}
