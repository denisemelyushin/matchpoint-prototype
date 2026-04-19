"use client";

import { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/lib/auth";
import { XIcon } from "@/components/icons";

type Mode = "signIn" | "signUp";

function messageForError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-email":
        return "That email address isn't valid.";
      case "auth/missing-password":
        return "Enter a password to continue.";
      case "auth/weak-password":
        return "Password is too weak — use at least 6 characters.";
      case "auth/email-already-in-use":
        return "An account with that email already exists. Try signing in.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email or password is incorrect.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a moment and try again.";
      case "auth/network-request-failed":
        return "Network error. Check your connection.";
      default:
        return err.message;
    }
  }
  return "Something went wrong. Please try again.";
}

/**
 * Sign-in / sign-up sheet. Rendered once at the app root and driven by
 * auth-context state — any component can call `requireAuth()` to trigger it
 * and wait for the user to complete authentication.
 */
export function AuthModal() {
  const { modalOpen, closeAuthModal, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signUp");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Reset form whenever the modal is re-opened so stale fields don't linger.
  useEffect(() => {
    if (!modalOpen) return;
    setError(null);
    setBusy(false);
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuthModal({ cancelled: true });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, closeAuthModal]);

  if (!modalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signUp") {
        if (!name.trim()) {
          setError("Enter your name to get started.");
          setBusy(false);
          return;
        }
        await signUp(email.trim(), password, name.trim());
      } else {
        await signIn(email.trim(), password);
      }
      // Success: requireAuth()'s pending resolver fires from the auth listener
      // in the provider; it also closes the modal. No explicit close here.
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(messageForError(err));
      setBusy(false);
    }
  };

  const title = mode === "signUp" ? "Create your account" : "Welcome back";
  const subtitle =
    mode === "signUp"
      ? "Sign up to post, like, and schedule games."
      : "Sign in to continue where you left off.";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => closeAuthModal({ cancelled: true })}
        tabIndex={-1}
        className="absolute inset-0 bg-black/70 cursor-default"
      />
      <div className="relative w-full max-w-[480px] bg-surface rounded-t-3xl sm:rounded-3xl border border-border/60 p-6 pb-8 shadow-2xl">
        <div className="mx-auto w-10 h-1 rounded-full bg-foreground/20 mb-4 sm:hidden" />
        <button
          type="button"
          aria-label="Close"
          onClick={() => closeAuthModal({ cancelled: true })}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-foreground active:opacity-70 transition-colors"
        >
          <XIcon size={22} color="currentColor" />
        </button>
        <h2
          id="auth-modal-title"
          className="text-foreground text-[20px] font-semibold leading-tight pr-8"
        >
          {title}
        </h2>
        <p className="text-muted text-[13px] mt-1 pr-8">{subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          {mode === "signUp" && (
            <label className="block">
              <span className="text-muted text-[12px] font-medium">Name</span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full bg-surface-light border border-border/60 rounded-xl px-3 py-2.5 text-foreground text-[14px] outline-none focus:border-primary/60"
                placeholder="Your name"
              />
            </label>
          )}
          <label className="block">
            <span className="text-muted text-[12px] font-medium">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-surface-light border border-border/60 rounded-xl px-3 py-2.5 text-foreground text-[14px] outline-none focus:border-primary/60"
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="text-muted text-[12px] font-medium">Password</span>
            <input
              type="password"
              autoComplete={
                mode === "signUp" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-surface-light border border-border/60 rounded-xl px-3 py-2.5 text-foreground text-[14px] outline-none focus:border-primary/60"
              placeholder={mode === "signUp" ? "At least 6 characters" : "Your password"}
            />
          </label>

          {error && (
            <p className="text-[13px] text-[#F87171] leading-snug">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 mt-3 rounded-full bg-primary text-[var(--app-primary-on)] text-[14px] font-semibold active:opacity-80 transition-opacity disabled:opacity-60"
          >
            {busy
              ? "Please wait…"
              : mode === "signUp"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <div className="mt-5 text-center">
          {mode === "signUp" ? (
            <button
              type="button"
              onClick={() => setMode("signIn")}
              className="text-[15px] text-muted"
            >
              Already have an account?{" "}
              <span className="text-foreground font-medium">Sign in</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode("signUp")}
              className="text-[15px] text-muted"
            >
              New to Matchpoint?{" "}
              <span className="text-foreground font-medium">Sign up</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
