"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app-store";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import {
  FieldLabel,
  PrivacyToggle,
  TextArea,
  TextInput,
} from "@/components/form";
import { ImageIcon, XIcon } from "@/components/icons";

export default function CreatePostPage() {
  const router = useRouter();
  const { currentUser, createPost } = useAppStore();

  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canPost = content.trim().length > 0 || !!imageDataUrl;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePost = () => {
    if (!canPost) return;
    createPost({
      content: content.trim(),
      image: imageDataUrl ?? undefined,
      location: location.trim() || undefined,
      isPrivate,
    });
    router.back();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader
        title="New Post"
        right={
          <button
            onClick={handlePost}
            disabled={!canPost}
            className="text-primary font-semibold text-sm disabled:text-muted"
          >
            Post
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex items-center gap-3 mb-5">
          <Avatar
            name={currentUser.name}
            initials={currentUser.initials}
            size={44}
          />
          <div>
            <p className="font-semibold text-foreground text-[15px]">
              {currentUser.name}
            </p>
            <p className="text-muted text-xs">{currentUser.email}</p>
          </div>
        </div>

        <TextArea
          autoFocus
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="text-base"
        />

        {imageDataUrl && (
          <div className="relative mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt="Preview"
              className="w-full rounded-xl max-h-[320px] object-cover"
            />
            <button
              onClick={() => setImageDataUrl(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Remove image"
            >
              <XIcon size={16} color="#fff" />
            </button>
          </div>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border active:scale-[0.98] transition-transform"
        >
          <ImageIcon size={18} color="var(--color-primary)" />
          <span className="text-foreground text-sm font-medium">
            {imageDataUrl ? "Change image" : "Add image"}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        <div className="mt-6">
          <FieldLabel htmlFor="location">Location (optional)</FieldLabel>
          <TextInput
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Riverside Courts"
          />
        </div>

        <div className="mt-6">
          <FieldLabel>Visibility</FieldLabel>
          <PrivacyToggle isPrivate={isPrivate} onChange={setIsPrivate} />
          <p className="text-muted text-xs mt-2">
            {isPrivate
              ? "Only your friends can see private posts."
              : "Everyone on MatchPoint app can see public posts."}
          </p>
        </div>
      </div>
    </div>
  );
}
