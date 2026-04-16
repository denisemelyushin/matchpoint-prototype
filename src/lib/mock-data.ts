export interface Post {
  id: string;
  user: {
    name: string;
    avatar: string;
    initials: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  liked: boolean;
  timeAgo: string;
  location?: string;
}

export const MOCK_POSTS: Post[] = [
  {
    id: "1",
    user: { name: "Sarah Chen", avatar: "", initials: "SC" },
    content: "Great doubles match today at Riverside Courts! Won 11-7, 11-9. My partner was on fire with those dinks! 🏓🔥",
    likes: 24,
    comments: 8,
    liked: false,
    timeAgo: "15 min ago",
    location: "Riverside Courts",
  },
  {
    id: "2",
    user: { name: "Marcus Johnson", avatar: "", initials: "MJ" },
    content: "Just hit my first Erne in a competitive game! All those practice sessions finally paying off. Thanks to everyone who gave me tips! 💪",
    likes: 47,
    comments: 15,
    liked: true,
    timeAgo: "1 hr ago",
    location: "Downtown Pickleball Center",
  },
  {
    id: "3",
    user: { name: "Emily Rodriguez", avatar: "", initials: "ER" },
    content: "Beautiful morning for pickleball! 6 AM crew never disappoints. Who's joining tomorrow? ☀️",
    likes: 32,
    comments: 12,
    liked: false,
    timeAgo: "2 hrs ago",
    location: "Sunset Park",
  },
  {
    id: "4",
    user: { name: "David Kim", avatar: "", initials: "DK" },
    content: "Tournament this weekend at Lakeview! Still need 2 more teams for mixed doubles. DM me if interested. Registration closes Friday! 🏆",
    likes: 56,
    comments: 23,
    liked: false,
    timeAgo: "3 hrs ago",
    location: "Lakeview Recreation Center",
  },
  {
    id: "5",
    user: { name: "Jessica Williams", avatar: "", initials: "JW" },
    content: "Finally broke through to 4.0 rating! It's been a long journey from beginner to here. Never stop improving! 📈",
    likes: 89,
    comments: 31,
    liked: true,
    timeAgo: "5 hrs ago",
  },
  {
    id: "6",
    user: { name: "Alex Thompson", avatar: "", initials: "AT" },
    content: "New paddle day! Testing out the Joola Hyperion CFS 16. First impressions — the control is insane. Full review coming soon.",
    likes: 18,
    comments: 7,
    liked: false,
    timeAgo: "6 hrs ago",
  },
  {
    id: "7",
    user: { name: "Rachel Park", avatar: "", initials: "RP" },
    content: "Drills session with the team was amazing today. Worked on third shot drops for an hour straight. Feeling more confident than ever! 🎯",
    likes: 41,
    comments: 9,
    liked: false,
    timeAgo: "8 hrs ago",
    location: "Community Sports Complex",
  },
];

const AVATAR_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
