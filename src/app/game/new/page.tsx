"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app-store";
import { AppHeader } from "@/components/AppHeader";
import {
  FieldLabel,
  PrivacyToggle,
  Select,
  TextArea,
  TextInput,
} from "@/components/form";
import {
  DEFAULT_COURTS,
  SKILL_LEVELS,
  type SkillLevel,
} from "@/lib/types";
import { toDatetimeLocalValue } from "@/lib/format";

const CUSTOM_COURT_VALUE = "__custom__";

export default function CreateGamePage() {
  const router = useRouter();
  const { createGame } = useAppStore();

  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    return toDatetimeLocalValue(d.toISOString());
  }, []);

  const [courtSelection, setCourtSelection] = useState<string>(
    DEFAULT_COURTS[0]
  );
  const [customCourt, setCustomCourt] = useState("");
  const [datetime, setDatetime] = useState(defaultDate);
  const [minSkill, setMinSkill] = useState<SkillLevel>("Beginner");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [notes, setNotes] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const court =
    courtSelection === CUSTOM_COURT_VALUE
      ? customCourt.trim()
      : courtSelection;

  const max = parseInt(maxPlayers, 10);
  const canSave =
    court.length > 0 &&
    datetime.length > 0 &&
    !Number.isNaN(max) &&
    max >= 2 &&
    max <= 16;

  const handleSave = () => {
    if (!canSave) return;
    const iso = new Date(datetime).toISOString();
    createGame({
      court,
      date: iso,
      minSkill,
      maxPlayers: max,
      notes: notes.trim() || undefined,
      isPrivate,
    });
    router.back();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader
        title="New Game"
        right={
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="text-primary font-semibold text-sm disabled:text-muted"
          >
            Create
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div>
          <FieldLabel htmlFor="court">Court</FieldLabel>
          <Select
            id="court"
            value={courtSelection}
            onChange={(e) => setCourtSelection(e.target.value)}
          >
            {DEFAULT_COURTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={CUSTOM_COURT_VALUE}>+ Add custom court</option>
          </Select>
          {courtSelection === CUSTOM_COURT_VALUE && (
            <div className="mt-3">
              <TextInput
                value={customCourt}
                onChange={(e) => setCustomCourt(e.target.value)}
                placeholder="Enter court name"
              />
            </div>
          )}
        </div>

        <div>
          <FieldLabel htmlFor="datetime">Date & Time</FieldLabel>
          <TextInput
            id="datetime"
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="skill">Min Skill Level</FieldLabel>
            <Select
              id="skill"
              value={minSkill}
              onChange={(e) => setMinSkill(e.target.value as SkillLevel)}
            >
              {SKILL_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="maxPlayers">Max Players</FieldLabel>
            <TextInput
              id="maxPlayers"
              type="number"
              min={2}
              max={16}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
            />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
          <TextArea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Anything players should know?"
            maxLength={240}
          />
        </div>

        <div>
          <FieldLabel>Visibility</FieldLabel>
          <PrivacyToggle isPrivate={isPrivate} onChange={setIsPrivate} />
          <p className="text-muted text-xs mt-2">
            {isPrivate
              ? "Only your friends can see and join private games."
              : "Everyone on MatchPoint app can see and join public games."}
          </p>
        </div>
      </div>
    </div>
  );
}
