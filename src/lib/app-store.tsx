"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Chat,
  Comment,
  Game,
  Message,
  Post,
  SkillLevel,
  User,
} from "./types";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function makeId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const CURRENT_USER_ID = "u_me";

const INITIAL_USERS: User[] = [
  {
    id: CURRENT_USER_ID,
    name: "Your Name",
    email: "you@example.com",
    bio: "Pickleball enthusiast. 3.5 rated. Always up for a game!",
    skillLevel: "Intermediate",
    initials: "YO",
  },
  {
    id: "u_sc",
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    bio: "Doubles specialist. Love a good dink battle.",
    skillLevel: "Advanced",
    initials: "SC",
  },
  {
    id: "u_mj",
    name: "Marcus Johnson",
    email: "marcus.j@example.com",
    bio: "Started playing 2 years ago. Obsessed ever since.",
    skillLevel: "Intermediate",
    initials: "MJ",
  },
  {
    id: "u_er",
    name: "Emily Rodriguez",
    email: "emily.r@example.com",
    bio: "Morning player. 6 AM crew regular.",
    skillLevel: "Advanced",
    initials: "ER",
  },
  {
    id: "u_dk",
    name: "David Kim",
    email: "david.kim@example.com",
    bio: "Tournament director & 4.5 player. DM for partner requests.",
    skillLevel: "Pro",
    initials: "DK",
  },
  {
    id: "u_jw",
    name: "Jessica Williams",
    email: "jess.w@example.com",
    bio: "Just broke into 4.0! Working on my third shot drops.",
    skillLevel: "Advanced",
    initials: "JW",
  },
  {
    id: "u_at",
    name: "Alex Thompson",
    email: "alex.t@example.com",
    bio: "Paddle collector. Always happy to let you try one.",
    skillLevel: "Intermediate",
    initials: "AT",
  },
  {
    id: "u_rp",
    name: "Rachel Park",
    email: "rachel.park@example.com",
    bio: "Ex-tennis player transitioning to pickleball. Learning fast.",
    skillLevel: "Intermediate",
    initials: "RP",
  },
  {
    id: "u_tb",
    name: "Tom Bradford",
    email: "tom.b@example.com",
    bio: "Weekend warrior. Open to matches any skill level.",
    skillLevel: "Beginner",
    initials: "TB",
  },
];

import { REFERENCE_NOW as NOW } from "./time";

const INITIAL_POSTS: Post[] = [
  {
    id: "p_1",
    userId: "u_sc",
    content:
      "Great doubles match today at Riverside Courts! Won 11-7, 11-9. My partner was on fire with those dinks!",
    location: "Riverside Courts",
    isPrivate: false,
    likes: 24,
    liked: false,
    comments: [
      {
        id: "c_1",
        userId: "u_mj",
        content: "Nice work! Who was your partner?",
        createdAt: NOW - 10 * MINUTE,
      },
      {
        id: "c_2",
        userId: "u_sc",
        content: "Jess! She was unstoppable today.",
        createdAt: NOW - 8 * MINUTE,
      },
    ],
    createdAt: NOW - 15 * MINUTE,
  },
  {
    id: "p_2",
    userId: "u_mj",
    content:
      "Just hit my first Erne in a competitive game! All those practice sessions finally paying off. Thanks to everyone who gave me tips!",
    location: "Downtown Pickleball Center",
    isPrivate: false,
    likes: 47,
    liked: true,
    comments: [
      {
        id: "c_3",
        userId: "u_dk",
        content: "Huge! Next step: backhand Erne.",
        createdAt: NOW - 50 * MINUTE,
      },
    ],
    createdAt: NOW - HOUR,
  },
  {
    id: "p_3",
    userId: "u_er",
    content:
      "Beautiful morning for pickleball! 6 AM crew never disappoints. Who's joining tomorrow?",
    location: "Sunset Park",
    isPrivate: false,
    likes: 32,
    liked: false,
    comments: [],
    createdAt: NOW - 2 * HOUR,
  },
  {
    id: "p_4",
    userId: "u_dk",
    content:
      "Tournament this weekend at Lakeview! Still need 2 more teams for mixed doubles. DM me if interested. Registration closes Friday!",
    location: "Lakeview Recreation Center",
    isPrivate: false,
    likes: 56,
    liked: false,
    comments: [
      {
        id: "c_4",
        userId: "u_rp",
        content: "Count me in! I'll message you.",
        createdAt: NOW - 2 * HOUR,
      },
    ],
    createdAt: NOW - 3 * HOUR,
  },
  {
    id: "p_5",
    userId: "u_jw",
    content:
      "Finally broke through to 4.0 rating! It's been a long journey from beginner to here. Never stop improving!",
    isPrivate: false,
    likes: 89,
    liked: true,
    comments: [],
    createdAt: NOW - 5 * HOUR,
  },
  {
    id: "p_6",
    userId: "u_at",
    content:
      "New paddle day! Testing out the Joola Hyperion CFS 16. First impressions — the control is insane. Full review coming soon.",
    isPrivate: false,
    likes: 18,
    liked: false,
    comments: [],
    createdAt: NOW - 6 * HOUR,
  },
  {
    id: "p_7",
    userId: "u_rp",
    content:
      "Drills session with the team was amazing today. Worked on third shot drops for an hour straight. Feeling more confident than ever!",
    location: "Community Sports Complex",
    isPrivate: false,
    likes: 41,
    liked: false,
    comments: [],
    createdAt: NOW - 8 * HOUR,
  },
];

const INITIAL_GAMES: Game[] = [
  {
    id: "g_1",
    userId: CURRENT_USER_ID,
    court: "Riverside Courts",
    date: new Date(NOW + 5 * DAY).toISOString(),
    minSkill: "Intermediate",
    maxPlayers: 4,
    notes: "Intermediate doubles — bring water and a good attitude!",
    isPrivate: false,
    playerIds: [CURRENT_USER_ID, "u_sc"],
    createdAt: NOW - HOUR,
  },
  {
    id: "g_2",
    userId: "u_er",
    court: "Sunset Park",
    date: new Date(NOW + DAY).toISOString(),
    minSkill: "Beginner",
    maxPlayers: 8,
    notes: "Casual morning session, all levels welcome.",
    isPrivate: false,
    playerIds: ["u_er", "u_tb", "u_rp", CURRENT_USER_ID],
    createdAt: NOW - 5 * HOUR,
  },
  {
    id: "g_3",
    userId: "u_dk",
    court: "Lakeview Recreation Center",
    date: new Date(NOW + 2 * DAY).toISOString(),
    minSkill: "Advanced",
    maxPlayers: 4,
    notes: "Competitive doubles. Bring your A-game.",
    isPrivate: false,
    playerIds: ["u_dk", "u_sc"],
    createdAt: NOW - 3 * HOUR,
  },
  {
    id: "g_4",
    userId: "u_at",
    court: "Community Sports Complex",
    date: new Date(NOW + 4 * DAY).toISOString(),
    minSkill: "Intermediate",
    maxPlayers: 4,
    notes: "Paddle demo afterwards!",
    isPrivate: false,
    playerIds: ["u_at", "u_mj", "u_jw", "u_rp"],
    createdAt: NOW - 2 * DAY,
  },
  {
    id: "g_5",
    userId: "u_mj",
    court: "Downtown Pickleball Center",
    date: new Date(NOW + 3 * DAY).toISOString(),
    minSkill: "Intermediate",
    maxPlayers: 4,
    isPrivate: false,
    playerIds: ["u_mj", "u_jw"],
    createdAt: NOW - DAY,
  },
];

const INITIAL_CHATS: Chat[] = [
  {
    id: "ch_1",
    participantIds: [CURRENT_USER_ID, "u_sc"],
    messages: [
      {
        id: "m_1",
        senderId: "u_sc",
        content: "Hey! Are you free for a game this weekend?",
        createdAt: NOW - 2 * HOUR,
      },
      {
        id: "m_2",
        senderId: CURRENT_USER_ID,
        content: "Sat morning works great for me!",
        createdAt: NOW - 90 * MINUTE,
      },
      {
        id: "m_3",
        senderId: "u_sc",
        content: "Perfect, 9am at Riverside?",
        createdAt: NOW - 30 * MINUTE,
      },
    ],
  },
  {
    id: "ch_2",
    participantIds: [CURRENT_USER_ID, "u_dk"],
    messages: [
      {
        id: "m_4",
        senderId: "u_dk",
        content: "Got 2 spots left in the tournament. You and a partner?",
        createdAt: NOW - 4 * HOUR,
      },
    ],
  },
  {
    id: "ch_3",
    participantIds: [CURRENT_USER_ID, "u_mj"],
    messages: [
      {
        id: "m_5",
        senderId: CURRENT_USER_ID,
        content: "Congrats on the Erne!",
        createdAt: NOW - DAY,
      },
      {
        id: "m_6",
        senderId: "u_mj",
        content: "Thanks! Took long enough haha",
        createdAt: NOW - DAY + 5 * MINUTE,
      },
    ],
  },
];

interface AppState {
  currentUserId: string;
  users: User[];
  posts: Post[];
  games: Game[];
  chats: Chat[];
}

interface AppStore extends AppState {
  currentUser: User;
  getUser: (id: string) => User | undefined;
  updateProfile: (partial: Partial<Omit<User, "id" | "initials">>) => void;
  createPost: (input: {
    content: string;
    image?: string;
    location?: string;
    isPrivate: boolean;
  }) => Post;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  getPost: (id: string) => Post | undefined;
  createGame: (input: {
    court: string;
    date: string;
    minSkill: SkillLevel;
    maxPlayers: number;
    notes?: string;
    isPrivate: boolean;
  }) => Game;
  joinGame: (gameId: string) => void;
  leaveGame: (gameId: string) => void;
  getChatWithUser: (otherUserId: string) => Chat | undefined;
  getChat: (id: string) => Chat | undefined;
  startOrGetChat: (otherUserId: string) => string;
  sendMessage: (chatId: string, content: string) => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);

  const currentUser = useMemo(
    () => users.find((u) => u.id === CURRENT_USER_ID) ?? users[0],
    [users]
  );

  const getUser = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  );

  const updateProfile = useCallback(
    (partial: Partial<Omit<User, "id" | "initials">>) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== CURRENT_USER_ID) return u;
          const next: User = { ...u, ...partial };
          if (partial.name) {
            const parts = partial.name.trim().split(/\s+/);
            const a = parts[0]?.[0] ?? "";
            const b = parts[1]?.[0] ?? "";
            next.initials = (a + b).toUpperCase() || u.initials;
          }
          return next;
        })
      );
    },
    []
  );

  const createPost = useCallback<AppStore["createPost"]>((input) => {
    const post: Post = {
      id: makeId("p"),
      userId: CURRENT_USER_ID,
      content: input.content,
      image: input.image,
      location: input.location,
      isPrivate: input.isPrivate,
      likes: 0,
      liked: false,
      comments: [],
      createdAt: Date.now(),
    };
    setPosts((prev) => [post, ...prev]);
    return post;
  }, []);

  const toggleLike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }
          : p
      )
    );
  }, []);

  const addComment = useCallback((postId: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const comment: Comment = {
      id: makeId("c"),
      userId: CURRENT_USER_ID,
      content: trimmed,
      createdAt: Date.now(),
    };
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
      )
    );
  }, []);

  const getPost = useCallback(
    (id: string) => posts.find((p) => p.id === id),
    [posts]
  );

  const createGame = useCallback<AppStore["createGame"]>((input) => {
    const game: Game = {
      id: makeId("g"),
      userId: CURRENT_USER_ID,
      court: input.court,
      date: input.date,
      minSkill: input.minSkill,
      maxPlayers: input.maxPlayers,
      notes: input.notes,
      isPrivate: input.isPrivate,
      playerIds: [CURRENT_USER_ID],
      createdAt: Date.now(),
    };
    setGames((prev) => [game, ...prev]);
    return game;
  }, []);

  const joinGame = useCallback((gameId: string) => {
    setGames((prev) =>
      prev.map((g) => {
        if (g.id !== gameId) return g;
        if (g.playerIds.includes(CURRENT_USER_ID)) return g;
        if (g.playerIds.length >= g.maxPlayers) return g;
        return { ...g, playerIds: [...g.playerIds, CURRENT_USER_ID] };
      })
    );
  }, []);

  const leaveGame = useCallback((gameId: string) => {
    setGames((prev) =>
      prev.map((g) => {
        if (g.id !== gameId) return g;
        if (g.userId === CURRENT_USER_ID) return g;
        return {
          ...g,
          playerIds: g.playerIds.filter((id) => id !== CURRENT_USER_ID),
        };
      })
    );
  }, []);

  const getChatWithUser = useCallback(
    (otherUserId: string) =>
      chats.find(
        (c) =>
          c.participantIds.includes(CURRENT_USER_ID) &&
          c.participantIds.includes(otherUserId)
      ),
    [chats]
  );

  const getChat = useCallback(
    (id: string) => chats.find((c) => c.id === id),
    [chats]
  );

  const startOrGetChat = useCallback(
    (otherUserId: string): string => {
      const existing = chats.find(
        (c) =>
          c.participantIds.includes(CURRENT_USER_ID) &&
          c.participantIds.includes(otherUserId)
      );
      if (existing) return existing.id;
      const chat: Chat = {
        id: makeId("ch"),
        participantIds: [CURRENT_USER_ID, otherUserId],
        messages: [],
      };
      setChats((prev) => [chat, ...prev]);
      return chat.id;
    },
    [chats]
  );

  const sendMessage = useCallback((chatId: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const message: Message = {
      id: makeId("m"),
      senderId: CURRENT_USER_ID,
      content: trimmed,
      createdAt: Date.now(),
    };
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, messages: [...c.messages, message] } : c
      )
    );
  }, []);

  const value: AppStore = {
    currentUserId: CURRENT_USER_ID,
    users,
    posts,
    games,
    chats,
    currentUser,
    getUser,
    updateProfile,
    createPost,
    toggleLike,
    addComment,
    getPost,
    createGame,
    joinGame,
    leaveGame,
    getChatWithUser,
    getChat,
    startOrGetChat,
    sendMessage,
  };

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }
  return ctx;
}
