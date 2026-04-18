"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import { useAuth } from "./auth";
import type {
  Chat,
  Comment,
  Game,
  Message,
  Post,
  SkillLevel,
  User,
} from "./types";

/* -------------------------------------------------------------------------- */
/*  Doc → client shape converters                                              */
/* -------------------------------------------------------------------------- */

function tsToMs(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number") return value;
  return 0;
}

function userFromDoc(id: string, data: DocumentData): User {
  return {
    id,
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    bio: String(data.bio ?? ""),
    skillLevel: (data.skillLevel as SkillLevel) ?? "Intermediate",
    initials: String(data.initials ?? "?"),
  };
}

interface PostBase {
  id: string;
  userId: string;
  content: string;
  image?: string;
  location?: string;
  isPrivate: boolean;
  likes: number;
  createdAt: number;
}

function postBaseFromDoc(id: string, data: DocumentData): PostBase {
  return {
    id,
    userId: String(data.userId ?? ""),
    content: String(data.content ?? ""),
    image: data.imageUrl ? String(data.imageUrl) : undefined,
    location: data.location ? String(data.location) : undefined,
    isPrivate: Boolean(data.isPrivate),
    likes: Number(data.likeCount ?? 0),
    createdAt: tsToMs(data.createdAt),
  };
}

function commentFromDoc(id: string, data: DocumentData): Comment {
  return {
    id,
    userId: String(data.userId ?? ""),
    content: String(data.content ?? ""),
    createdAt: tsToMs(data.createdAt),
  };
}

function gameFromDoc(id: string, data: DocumentData): Game {
  return {
    id,
    userId: String(data.userId ?? ""),
    court: String(data.court ?? ""),
    date: new Date(tsToMs(data.date)).toISOString(),
    minSkill: (data.minSkill as SkillLevel) ?? "Intermediate",
    maxPlayers: Number(data.maxPlayers ?? 4),
    notes: data.notes ? String(data.notes) : undefined,
    isPrivate: Boolean(data.isPrivate),
    playerIds: Array.isArray(data.playerIds)
      ? (data.playerIds as string[])
      : [],
    createdAt: tsToMs(data.createdAt),
  };
}

function messageFromDoc(id: string, data: DocumentData): Message {
  return {
    id,
    senderId: String(data.senderId ?? ""),
    content: String(data.content ?? ""),
    createdAt: tsToMs(data.createdAt),
  };
}

/* -------------------------------------------------------------------------- */
/*  IDs & helpers                                                              */
/* -------------------------------------------------------------------------- */

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase().slice(0, 2) || "?";
}

// 1:1 chats are keyed deterministically by sorted participant IDs. This
// guarantees that each pair of users maps to exactly one chat document.
function chatIdFor(a: string, b: string): string {
  return [a, b].sort().join("__");
}

/* -------------------------------------------------------------------------- */
/*  Store shape                                                                */
/* -------------------------------------------------------------------------- */

interface AppStore {
  // Readable state. `currentUser`/`currentUserId` are null while the user is
  // browsing in guest mode. Consumers must handle the null case.
  currentUserId: string | null;
  currentUser: User | null;
  users: User[];
  posts: Post[];
  games: Game[];
  chats: Chat[];
  friendIds: string[];

  // Lookups.
  getUser: (id: string) => User | undefined;
  getPost: (id: string) => Post | undefined;
  getChat: (id: string) => Chat | undefined;
  getChatWithUser: (otherUserId: string) => Chat | undefined;
  isFriend: (userId: string) => boolean;

  // Mutations. All of these require authentication; if the user is a guest,
  // they trigger the auth modal and only run after sign-in. Rejected promises
  // mean the user cancelled the auth flow or the write failed.
  updateProfile: (
    partial: Partial<Omit<User, "id" | "initials">>
  ) => Promise<void>;
  toggleFriend: (userId: string) => Promise<void>;
  createPost: (input: {
    content: string;
    image?: string;
    location?: string;
    isPrivate: boolean;
  }) => Promise<Post>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  createGame: (input: {
    court: string;
    date: string;
    minSkill: SkillLevel;
    maxPlayers: number;
    notes?: string;
    isPrivate: boolean;
  }) => Promise<Game>;
  joinGame: (gameId: string) => Promise<void>;
  leaveGame: (gameId: string) => Promise<void>;
  startOrGetChat: (otherUserId: string) => Promise<string>;
  sendMessage: (chatId: string, content: string) => Promise<void>;
}

const AppStoreContext = createContext<AppStore | null>(null);

/* -------------------------------------------------------------------------- */
/*  Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { currentUserId, requireAuth } = useAuth();
  const db = getFirebaseDb();

  const [users, setUsers] = useState<User[]>([]);
  const [postBases, setPostBases] = useState<Map<string, PostBase>>(new Map());
  const [commentsByPost, setCommentsByPost] = useState<Map<string, Comment[]>>(
    new Map()
  );
  const [myLikedPostIds, setMyLikedPostIds] = useState<Set<string>>(new Set());
  const [games, setGames] = useState<Game[]>([]);
  const [chatMetas, setChatMetas] = useState<
    Map<string, { id: string; participantIds: [string, string] }>
  >(new Map());
  const [messagesByChat, setMessagesByChat] = useState<Map<string, Message[]>>(
    new Map()
  );

  // Per-chat messages subscriptions — keyed by chatId.
  const chatMessagesUnsubsRef = useRef<Map<string, Unsubscribe>>(new Map());

  /* ---------- users -------------------------------------------------------- */

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        setUsers(snap.docs.map((d) => userFromDoc(d.id, d.data())));
      },
      (err) => {
        // Log but don't crash — the UI degrades gracefully to an empty list.
        console.error("[app-store] users snapshot error:", err);
      }
    );
    return unsub;
  }, [db]);

  /* ---------- current user's doc (for friendIds etc.) ---------------------- */

  const [myUserDocData, setMyUserDocData] = useState<DocumentData | null>(null);

  useEffect(() => {
    if (!currentUserId) {
      setMyUserDocData(null);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "users", currentUserId),
      (snap) => setMyUserDocData(snap.exists() ? snap.data() : null),
      (err) => console.error("[app-store] current user snapshot error:", err)
    );
    return unsub;
  }, [db, currentUserId]);

  const friendIds: string[] = useMemo(() => {
    const raw = myUserDocData?.friendIds;
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [myUserDocData]);

  /* ---------- posts -------------------------------------------------------- */

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "posts"), orderBy("createdAt", "desc")),
      (snap) => {
        const next = new Map<string, PostBase>();
        for (const d of snap.docs) {
          next.set(d.id, postBaseFromDoc(d.id, d.data()));
        }
        setPostBases(next);
      },
      (err) => console.error("[app-store] posts snapshot error:", err)
    );
    return unsub;
  }, [db]);

  useEffect(() => {
    const unsub = onSnapshot(
      collectionGroup(db, "comments"),
      (snap) => {
        const next = new Map<string, Comment[]>();
        for (const d of snap.docs) {
          const postId = d.ref.parent.parent?.id;
          if (!postId) continue;
          const arr = next.get(postId) ?? [];
          arr.push(commentFromDoc(d.id, d.data()));
          next.set(postId, arr);
        }
        for (const arr of next.values()) {
          arr.sort((a, b) => a.createdAt - b.createdAt);
        }
        setCommentsByPost(next);
      },
      (err) => console.error("[app-store] comments snapshot error:", err)
    );
    return unsub;
  }, [db]);

  // Track which posts the signed-in user has liked.
  useEffect(() => {
    if (!currentUserId) {
      setMyLikedPostIds(new Set());
      return;
    }
    const unsub = onSnapshot(
      query(
        collectionGroup(db, "likes"),
        where("userId", "==", currentUserId)
      ),
      (snap) => {
        const next = new Set<string>();
        for (const d of snap.docs) {
          const postId = d.ref.parent.parent?.id;
          if (postId) next.add(postId);
        }
        setMyLikedPostIds(next);
      },
      (err) => console.error("[app-store] my-likes snapshot error:", err)
    );
    return unsub;
  }, [db, currentUserId]);

  const posts: Post[] = useMemo(() => {
    const out: Post[] = [];
    for (const base of postBases.values()) {
      out.push({
        id: base.id,
        userId: base.userId,
        content: base.content,
        image: base.image,
        location: base.location,
        isPrivate: base.isPrivate,
        likes: base.likes,
        liked: myLikedPostIds.has(base.id),
        comments: commentsByPost.get(base.id) ?? [],
        createdAt: base.createdAt,
      });
    }
    out.sort((a, b) => b.createdAt - a.createdAt);
    return out;
  }, [postBases, commentsByPost, myLikedPostIds]);

  /* ---------- games -------------------------------------------------------- */

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "games"), orderBy("date", "asc")),
      (snap) => {
        setGames(snap.docs.map((d) => gameFromDoc(d.id, d.data())));
      },
      (err) => console.error("[app-store] games snapshot error:", err)
    );
    return unsub;
  }, [db]);

  /* ---------- chats + messages -------------------------------------------- */

  useEffect(() => {
    if (!currentUserId) {
      setChatMetas(new Map());
      setMessagesByChat(new Map());
      // Tear down any lingering per-chat subs.
      for (const u of chatMessagesUnsubsRef.current.values()) u();
      chatMessagesUnsubsRef.current.clear();
      return;
    }
    const unsub = onSnapshot(
      query(
        collection(db, "chats"),
        where("participantIds", "array-contains", currentUserId)
      ),
      (snap) => {
        const next = new Map<string, { id: string; participantIds: [string, string] }>();
        for (const d of snap.docs) {
          const data = d.data();
          const pids = Array.isArray(data.participantIds)
            ? (data.participantIds as string[])
            : [];
          if (pids.length !== 2) continue;
          next.set(d.id, {
            id: d.id,
            participantIds: [pids[0], pids[1]] as [string, string],
          });
        }
        setChatMetas(next);

        // Sync per-chat message subscriptions: add subs for new chats, remove
        // subs for chats the user is no longer in.
        const current = chatMessagesUnsubsRef.current;
        for (const id of current.keys()) {
          if (!next.has(id)) {
            current.get(id)?.();
            current.delete(id);
            setMessagesByChat((prev) => {
              const copy = new Map(prev);
              copy.delete(id);
              return copy;
            });
          }
        }
        for (const id of next.keys()) {
          if (current.has(id)) continue;
          const msgUnsub = onSnapshot(
            query(
              collection(db, "chats", id, "messages"),
              orderBy("createdAt", "asc")
            ),
            (msgSnap) => {
              const msgs = msgSnap.docs.map((m) =>
                messageFromDoc(m.id, m.data())
              );
              setMessagesByChat((prev) => {
                const copy = new Map(prev);
                copy.set(id, msgs);
                return copy;
              });
            },
            (err) =>
              console.error(
                `[app-store] messages snapshot error for chat ${id}:`,
                err
              )
          );
          current.set(id, msgUnsub);
        }
      },
      (err) => console.error("[app-store] chats snapshot error:", err)
    );
    return () => {
      unsub();
      for (const u of chatMessagesUnsubsRef.current.values()) u();
      chatMessagesUnsubsRef.current.clear();
    };
  }, [db, currentUserId]);

  const chats: Chat[] = useMemo(() => {
    const out: Chat[] = [];
    for (const meta of chatMetas.values()) {
      out.push({
        id: meta.id,
        participantIds: meta.participantIds,
        messages: messagesByChat.get(meta.id) ?? [],
      });
    }
    // Sort by most recent message first (fallback: chat id for deterministic order).
    out.sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1]?.createdAt ?? 0;
      const bLast = b.messages[b.messages.length - 1]?.createdAt ?? 0;
      return bLast - aLast;
    });
    return out;
  }, [chatMetas, messagesByChat]);

  /* ---------- derived ------------------------------------------------------ */

  const currentUser = useMemo<User | null>(() => {
    if (!currentUserId) return null;
    return users.find((u) => u.id === currentUserId) ?? null;
  }, [users, currentUserId]);

  const getUser = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  );
  const getPost = useCallback(
    (id: string) => posts.find((p) => p.id === id),
    [posts]
  );
  const getChat = useCallback(
    (id: string) => chats.find((c) => c.id === id),
    [chats]
  );
  const getChatWithUser = useCallback(
    (otherUserId: string) => {
      if (!currentUserId) return undefined;
      const id = chatIdFor(currentUserId, otherUserId);
      return chats.find((c) => c.id === id);
    },
    [chats, currentUserId]
  );
  const isFriend = useCallback(
    (userId: string) => friendIds.includes(userId),
    [friendIds]
  );

  /* ---------- mutations ---------------------------------------------------- */

  const updateProfile = useCallback<AppStore["updateProfile"]>(
    async (partial) => {
      const uid = await requireAuth();
      const ref = doc(db, "users", uid);
      const patch: DocumentData = { ...partial, updatedAt: serverTimestamp() };
      if (partial.name) {
        patch.initials = initialsFromName(partial.name);
      }
      await updateDoc(ref, patch);
    },
    [db, requireAuth]
  );

  const toggleFriend = useCallback<AppStore["toggleFriend"]>(
    async (userId) => {
      const uid = await requireAuth();
      if (userId === uid) return;
      const ref = doc(db, "users", uid);
      const isCurrentlyFriend = friendIds.includes(userId);
      await updateDoc(ref, {
        friendIds: isCurrentlyFriend
          ? arrayRemove(userId)
          : arrayUnion(userId),
        updatedAt: serverTimestamp(),
      });
    },
    [db, requireAuth, friendIds]
  );

  const createPost = useCallback<AppStore["createPost"]>(
    async (input) => {
      const uid = await requireAuth();
      const data: DocumentData = {
        userId: uid,
        content: input.content,
        isPrivate: input.isPrivate,
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
      };
      if (input.image) data.imageUrl = input.image;
      if (input.location) data.location = input.location;
      const ref = await addDoc(collection(db, "posts"), data);
      // Return a client-shaped post with `createdAt` set to the local clock;
      // the real Timestamp will arrive via the snapshot subscription and
      // overwrite this immediately.
      return {
        id: ref.id,
        userId: uid,
        content: input.content,
        image: input.image,
        location: input.location,
        isPrivate: input.isPrivate,
        likes: 0,
        liked: false,
        comments: [],
        createdAt: Date.now(),
      };
    },
    [db, requireAuth]
  );

  const toggleLike = useCallback<AppStore["toggleLike"]>(
    async (postId) => {
      const uid = await requireAuth();
      const postRef = doc(db, "posts", postId);
      const likeRef = doc(db, "posts", postId, "likes", uid);
      const liked = myLikedPostIds.has(postId);
      await runTransaction(db, async (tx) => {
        const postSnap = await tx.get(postRef);
        if (!postSnap.exists()) return;
        if (liked) {
          tx.delete(likeRef);
          tx.update(postRef, { likeCount: increment(-1) });
        } else {
          tx.set(likeRef, {
            userId: uid,
            createdAt: serverTimestamp(),
          });
          tx.update(postRef, { likeCount: increment(1) });
        }
      });
    },
    [db, requireAuth, myLikedPostIds]
  );

  const addComment = useCallback<AppStore["addComment"]>(
    async (postId, content) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const uid = await requireAuth();
      const postRef = doc(db, "posts", postId);
      await addDoc(collection(db, "posts", postId, "comments"), {
        userId: uid,
        content: trimmed,
        createdAt: serverTimestamp(),
      });
      await updateDoc(postRef, { commentCount: increment(1) });
    },
    [db, requireAuth]
  );

  const createGame = useCallback<AppStore["createGame"]>(
    async (input) => {
      const uid = await requireAuth();
      const startMs = new Date(input.date).getTime();
      const data: DocumentData = {
        userId: uid,
        court: input.court,
        date: Timestamp.fromMillis(startMs),
        minSkill: input.minSkill,
        maxPlayers: input.maxPlayers,
        isPrivate: input.isPrivate,
        playerIds: [uid],
        playerCount: 1,
        createdAt: serverTimestamp(),
      };
      if (input.notes) data.notes = input.notes;
      const ref = await addDoc(collection(db, "games"), data);
      return {
        id: ref.id,
        userId: uid,
        court: input.court,
        date: input.date,
        minSkill: input.minSkill,
        maxPlayers: input.maxPlayers,
        notes: input.notes,
        isPrivate: input.isPrivate,
        playerIds: [uid],
        createdAt: Date.now(),
      };
    },
    [db, requireAuth]
  );

  const joinGame = useCallback<AppStore["joinGame"]>(
    async (gameId) => {
      const uid = await requireAuth();
      const ref = doc(db, "games", gameId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data();
        const players: string[] = Array.isArray(data.playerIds)
          ? data.playerIds
          : [];
        if (players.includes(uid)) return;
        if (players.length >= Number(data.maxPlayers ?? 0)) return;
        tx.update(ref, {
          playerIds: arrayUnion(uid),
          playerCount: increment(1),
        });
      });
    },
    [db, requireAuth]
  );

  const leaveGame = useCallback<AppStore["leaveGame"]>(
    async (gameId) => {
      const uid = await requireAuth();
      const ref = doc(db, "games", gameId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.userId === uid) return; // host can't leave their own game
        const players: string[] = Array.isArray(data.playerIds)
          ? data.playerIds
          : [];
        if (!players.includes(uid)) return;
        tx.update(ref, {
          playerIds: arrayRemove(uid),
          playerCount: increment(-1),
        });
      });
    },
    [db, requireAuth]
  );

  const startOrGetChat = useCallback<AppStore["startOrGetChat"]>(
    async (otherUserId) => {
      const uid = await requireAuth();
      if (otherUserId === uid) {
        throw new Error("Cannot start a chat with yourself");
      }
      const id = chatIdFor(uid, otherUserId);
      const ref = doc(db, "chats", id);
      // Idempotent create: writing with setDoc({merge:true}) is safe whether
      // the chat already exists or not.
      await setDoc(
        ref,
        {
          participantIds: [uid, otherUserId].sort(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      return id;
    },
    [db, requireAuth]
  );

  const sendMessage = useCallback<AppStore["sendMessage"]>(
    async (chatId, content) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const uid = await requireAuth();
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: uid,
        content: trimmed,
        createdAt: serverTimestamp(),
      });
      // Denormalise the latest-message preview onto the chat doc so the
      // Chats list can render without reading every subcollection.
      await updateDoc(doc(db, "chats", chatId), {
        lastMessagePreview: trimmed.slice(0, 120),
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: uid,
      });
    },
    [db, requireAuth]
  );

  const value: AppStore = {
    currentUserId,
    currentUser,
    users,
    posts,
    games,
    chats,
    friendIds,
    getUser,
    getPost,
    getChat,
    getChatWithUser,
    isFriend,
    updateProfile,
    toggleFriend,
    createPost,
    toggleLike,
    addComment,
    createGame,
    joinGame,
    leaveGame,
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
