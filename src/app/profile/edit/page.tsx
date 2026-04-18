"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app-store";
import { useRequireAuthPage } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
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

  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(
    currentUser.skillLevel
  );
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      router.push("/");
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

        <div className="mt-10 pt-6 border-t border-border/60 flex justify-center">
          <button
            onClick={handleDeleteAccount}
            className="px-3 py-2 text-[13px] text-muted hover:text-[#F87171] active:text-[#F87171] transition-colors"
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
