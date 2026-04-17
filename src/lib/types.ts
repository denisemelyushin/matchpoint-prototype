export type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Pro";

export const SKILL_LEVELS: SkillLevel[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Pro",
];

export interface User {
  id: string;
  name: string;
  email: string;
  bio: string;
  skillLevel: SkillLevel;
  initials: string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: number;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  image?: string;
  location?: string;
  isPrivate: boolean;
  likes: number;
  liked: boolean;
  comments: Comment[];
  createdAt: number;
}

export interface Game {
  id: string;
  userId: string;
  court: string;
  date: string;
  minSkill: SkillLevel;
  maxPlayers: number;
  notes?: string;
  isPrivate: boolean;
  playerIds: string[];
  createdAt: number;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: number;
}

export interface Chat {
  id: string;
  participantIds: [string, string];
  messages: Message[];
}

export const DEFAULT_COURTS = [
  "Riverside Courts",
  "Downtown Pickleball Center",
  "Sunset Park",
  "Lakeview Recreation Center",
  "Community Sports Complex",
  "Oakwood Tennis & Pickleball",
  "Central Park Courts",
];
