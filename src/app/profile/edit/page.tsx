"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app-store";
import { useAuth, useRequireAuthPage } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  FieldLabel,
  Select,
  TextArea,
  TextInput,
} from "@/components/form";
import { EditIcon } from "@/components/icons";
import { SKILL_LEVELS, type SkillLevel, type User } from "@/lib/types";

export default function EditProfilePage() {
  const router = useRouter();
  const handleCancel = useCallback(() => router.push("/feed"), [router]);
  const { isReady } = useRequireAuthPage(handleCancel);
  const { currentUser } = useAppStore();

  if (!isReady || !currentUser) return null;

  // `currentUser` has stabilised — render the form with it as initial state.
  return <EditProfileForm currentUser={currentUser} />;
}

function EditProfileForm({ currentUser }: { currentUser: User }) {
  const router = useRouter();
  const { updateProfile } = useAppStore();
  const { deleteAccount, currentUserId } = useAuth();

  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(
    currentUser.skillLevel
  );
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingWelcomeRedirect, setPendingWelcomeRedirect] = useState(false);
  // When Firebase demands a fresh sign-in for deletion, we open a password
  // prompt so the user can reauthenticate and delete in one step (rather
  // than being silently signed out and losing context).
  const [reauthPromptOpen, setReauthPromptOpen] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [reauthError, setReauthError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // After a successful account deletion we need to wait for the auth
  // listener to clear `currentUserId` before navigating — otherwise the
  // welcome page still sees a signed-in user and bounces us to /feed.
  useEffect(() => {
    if (pendingWelcomeRedirect && !currentUserId) {
      router.replace("/");
    }
  }, [pendingWelcomeRedirect, currentUserId, router]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const canSave = !submitting && name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        skillLevel,
      });
      router.back();
    } catch (err) {
      console.error("[profile/edit] failed to save profile:", err);
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteError(null);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      setConfirmDeleteOpen(false);
      // Defer navigation until the auth listener clears currentUserId so
      // the welcome page doesn't redirect us back to /feed on a stale
      // auth state.
      setPendingWelcomeRedirect(true);
    } catch (err) {
      if (err instanceof Error && err.message === "requires-recent-login") {
        // Firebase won't delete the user without a fresh sign-in. Prompt
        // for password and retry — in one flow, rather than signing them
        // out and hoping they figure it out.
        setConfirmDeleteOpen(false);
        setReauthPassword("");
        setReauthError(null);
        setReauthPromptOpen(true);
        setDeleting(false);
        return;
      }
      console.error("[profile/edit] failed to delete account:", err);
      setDeleteError("Couldn't delete your account. Please try again.");
      setDeleting(false);
    }
  };

  const handleReauthAndDelete = async () => {
    if (deleting) return;
    const pwd = reauthPassword;
    if (!pwd) {
      setReauthError("Please enter your password.");
      return;
    }
    setDeleting(true);
    setReauthError(null);
    try {
      await deleteAccount(pwd);
      setReauthPromptOpen(false);
      setReauthPassword("");
      setPendingWelcomeRedirect(true);
    } catch (err) {
      if (err instanceof Error && err.message === "wrong-password") {
        setReauthError("Incorrect password. Please try again.");
      } else if (err instanceof Error && err.message === "no-password-method") {
        setReauthError(
          "This account doesn't use a password. Sign out and back in to delete."
        );
      } else {
        console.error("[profile/edit] failed to delete account:", err);
        setReauthError("Couldn't delete your account. Please try again.");
      }
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader
        title="Edit Profile"
        right={
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="text-primary font-semibold text-sm disabled:text-muted"
          >
            Save
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="flex flex-col items-center mb-8">
          <button
            onClick={handleAvatarClick}
            className="relative active:scale-95 transition-transform"
          >
            {avatarDataUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarDataUrl}
                alt="Avatar preview"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <Avatar
                name={name || currentUser.name}
                initials={currentUser.initials}
                size={96}
              />
            )}
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <EditIcon size={14} color="var(--app-primary-on)" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <p className="mt-3 text-muted text-xs">Tap to change avatar</p>
        </div>

        <div className="space-y-5">
          <div>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <TextInput
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <FieldLabel htmlFor="bio">Bio</FieldLabel>
            <TextArea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Tell others about yourself…"
              maxLength={240}
            />
            <p className="text-muted text-xs mt-1 text-right">
              {bio.length}/240
            </p>
          </div>

          <div>
            <FieldLabel htmlFor="skill">Skill Level</FieldLabel>
            <Select
              id="skill"
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
            >
              {SKILL_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col items-center gap-2">
          <button
            onClick={handleDeleteAccount}
            className="px-3 py-2 text-[13px] text-muted hover:text-[#F87171] active:text-[#F87171] transition-colors"
          >
            Delete account
          </button>
          {deleteError && (
            <p className="text-[12px] text-[#F87171] text-center max-w-[280px] leading-snug">
              {deleteError}
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete your account?"
        message="This permanently removes your Matchpoint account and all your data. This action cannot be undone."
        confirmLabel={deleting ? "Deleting…" : "Delete account"}
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (deleting) return;
          setConfirmDeleteOpen(false);
        }}
      />

      {reauthPromptOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reauth-dialog-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
        >
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => {
              if (deleting) return;
              setReauthPromptOpen(false);
              setReauthPassword("");
              setReauthError(null);
            }}
            tabIndex={-1}
            className="absolute inset-0 bg-black/60 cursor-default"
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleReauthAndDelete();
            }}
            className="relative bg-surface border border-border/60 rounded-2xl shadow-2xl w-full max-w-[320px] p-5"
          >
            <h2
              id="reauth-dialog-title"
              className="font-semibold text-foreground text-[16px] leading-tight"
            >
              Confirm your password
            </h2>
            <p className="text-muted text-[13px] mt-2 leading-relaxed">
              For your security, re-enter your password to permanently delete
              your account.
            </p>
            <div className="mt-4">
              <TextInput
                type="password"
                autoFocus
                autoComplete="current-password"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                placeholder="Password"
                disabled={deleting}
              />
            </div>
            {reauthError && (
              <p className="text-[12px] text-[#F87171] mt-2 leading-snug">
                {reauthError}
              </p>
            )}
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => {
                  if (deleting) return;
                  setReauthPromptOpen(false);
                  setReauthPassword("");
                  setReauthError(null);
                }}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-full bg-foreground/5 text-foreground text-[14px] font-medium active:opacity-80 transition-opacity disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleting || reauthPassword.length === 0}
                className="flex-1 py-2.5 rounded-full bg-[#F87171]/15 text-[#F87171] text-[14px] font-medium active:opacity-80 transition-opacity disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
