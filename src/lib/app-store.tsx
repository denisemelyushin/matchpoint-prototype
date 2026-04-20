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
  writeBatch,
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

// Firestore's `serverTimestamp()` is `null` locally until the server acks,
// which makes a brand-new post / message / comment render with createdAt=0
// for a flicker. Reading the snapshot with `serverTimestamps: "estimate"`
// swaps in a local estimate based on when the write was performed, so the
// doc appears instantly in the correct place and reconciles seamlessly
// once the server resolves the real timestamp.
const SNAPSHOT_OPTIONS = { serverTimestamps: "estimate" } as const;

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

/** Current friendship state between the signed-in user and another user. */
export type FriendshipStatus =
  | "none"
  | "friends"
  | "outgoing" // I've requested them; awaiting their accept.
  | "incoming"; // They've requested me; I can accept or decline.

export interface AppStore {
  // Readable state. `currentUser`/`currentUserId` are null while the user is
  // browsing in guest mode. Consumers must handle the null case.
  currentUserId: string | null;
  currentUser: User | null;
  users: User[];
  posts: Post[];
  games: Game[];
  chats: Chat[];
  friendIds: string[];
  incomingFriendRequests: string[];
  outgoingFriendRequests: string[];

  // Lookups.
  getUser: (id: string) => User | undefined;
  getPost: (id: string) => Post | undefined;
  getGame: (id: string) => Game | undefined;
  getChat: (id: string) => Chat | undefined;
  getChatWithUser: (otherUserId: string) => Chat | undefined;
  isFriend: (userId: string) => boolean;
  /** Friendship state between the current user and another user. */
  getFriendshipStatus: (userId: string) => FriendshipStatus;
  /**
   * True when a private post/game authored by `authorId` should be visible
   * to the current user (author themselves, or a confirmed friend of the
   * author). Returns false for guests. For public content this check is
   * unnecessary — the feed filters already short-circuit `!isPrivate`.
   */
  canSeePrivateContentFrom: (authorId: string) => boolean;

  // Mutations. All of these require authentication; if the user is a guest,
  // they trigger the auth modal and only run after sign-in. Rejected promises
  // mean the user cancelled the auth flow or the write failed.
  updateProfile: (
    partial: Partial<Omit<User, "id" | "initials">>
  ) => Promise<void>;
  /**
   * Send a friend request. If there's an incoming request from this user we
   * accept it instead (the common "mutual add" shortcut). No-op if already
   * friends or if a request is already outstanding.
   */
  sendFriendRequest: (userId: string) => Promise<void>;
  /** Undo an outgoing request we previously sent. No-op if not outstanding. */
  cancelFriendRequest: (userId: string) => Promise<void>;
  /** Accept an incoming request. No-op if there's no such request. */
  acceptFriendRequest: (userId: string) => Promise<void>;
  /** Decline an incoming request (drops it, doesn't create a friendship). */
  declineFriendRequest: (userId: string) => Promise<void>;
  /** Break an existing mutual friendship from both sides. */
  removeFriend: (userId: string) => Promise<void>;
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
  // Author → friendIds lookup. Used to answer "can the current viewer see
  // this private post/game?" without needing a server-side denormalised
  // `visibleTo` field. friendIds is already publicly readable per rules.
  const [friendIdsByUser, setFriendIdsByUser] = useState<Map<string, string[]>>(
    new Map()
  );
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
        const nextFriends = new Map<string, string[]>();
        for (const d of snap.docs) {
          const data = d.data();
          const raw = data.friendIds;
          nextFriends.set(d.id, Array.isArray(raw) ? (raw as string[]) : []);
        }
        setFriendIdsByUser(nextFriends);
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

  const incomingFriendRequests: string[] = useMemo(() => {
    const raw = myUserDocData?.incomingFriendRequests;
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [myUserDocData]);

  const outgoingFriendRequests: string[] = useMemo(() => {
    const raw = myUserDocData?.outgoingFriendRequests;
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [myUserDocData]);

  /* ---------- posts -------------------------------------------------------- */

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "posts"), orderBy("createdAt", "desc")),
      (snap) => {
        const next = new Map<string, PostBase>();
        for (const d of snap.docs) {
          next.set(d.id, postBaseFromDoc(d.id, d.data(SNAPSHOT_OPTIONS)));
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
          arr.push(commentFromDoc(d.id, d.data(SNAPSHOT_OPTIONS)));
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
        setGames(snap.docs.map((d) => gameFromDoc(d.id, d.data(SNAPSHOT_OPTIONS))));
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
      // Listen for metadata changes too so we can re-evaluate per-chat
      // subscriptions once a locally-pending new chat has been server-
      // committed. Without this, a brand-new chat's message listener would
      // start while the parent chat doc is still pending on the server, and
      // the messages rule's `get(chats/$chatId)` would fail with
      // permission-denied because the chat doc hasn't propagated yet.
      { includeMetadataChanges: true },
      (snap) => {
        const next = new Map<
          string,
          {
            id: string;
            participantIds: [string, string];
            serverCommitted: boolean;
          }
        >();
        for (const d of snap.docs) {
          const data = d.data(SNAPSHOT_OPTIONS);
          const pids = Array.isArray(data.participantIds)
            ? (data.participantIds as string[])
            : [];
          if (pids.length !== 2) continue;
          next.set(d.id, {
            id: d.id,
            participantIds: [pids[0], pids[1]] as [string, string],
            serverCommitted: !d.metadata.hasPendingWrites,
          });
        }
        setChatMetas(
          new Map(
            Array.from(next, ([id, v]) => [
              id,
              { id: v.id, participantIds: v.participantIds },
            ])
          )
        );

        // Sync per-chat message subscriptions: add subs for new (server-
        // committed) chats, remove subs for chats the user is no longer in.
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
        for (const [id, meta] of next) {
          if (current.has(id)) continue;
          // Skip until the chat doc has been server-committed — otherwise
          // the per-chat message listener races with the chat write and the
          // messages rule denies access.
          if (!meta.serverCommitted) continue;
          const msgUnsub = onSnapshot(
            query(
              collection(db, "chats", id, "messages"),
              orderBy("createdAt", "asc")
            ),
            (msgSnap) => {
              const msgs = msgSnap.docs.map((m) =>
                messageFromDoc(m.id, m.data(SNAPSHOT_OPTIONS))
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
  const getGame = useCallback(
    (id: string) => games.find((g) => g.id === id),
    [games]
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

  const getFriendshipStatus = useCallback<AppStore["getFriendshipStatus"]>(
    (userId) => {
      if (!currentUserId || userId === currentUserId) return "none";
      if (friendIds.includes(userId)) return "friends";
      if (outgoingFriendRequests.includes(userId)) return "outgoing";
      if (incomingFriendRequests.includes(userId)) return "incoming";
      return "none";
    },
    [currentUserId, friendIds, outgoingFriendRequests, incomingFriendRequests]
  );

  const canSeePrivateContentFrom = useCallback<
    AppStore["canSeePrivateContentFrom"]
  >(
    (authorId) => {
      if (!currentUserId) return false;
      if (authorId === currentUserId) return true;
      const authorFriends = friendIdsByUser.get(authorId);
      return Array.isArray(authorFriends) && authorFriends.includes(currentUserId);
    },
    [currentUserId, friendIdsByUser]
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

  /**
   * Friendship mutations use a `WriteBatch` so the writer's doc and the
   * other user's doc move in lock-step. Each action is also idempotent:
   * if the caller's local state is already in the target state (e.g. a
   * pending accept fired twice), the batch becomes a no-op arrayUnion /
   * arrayRemove and we skip the round-trip entirely.
   */
  const sendFriendRequest = useCallback<AppStore["sendFriendRequest"]>(
    async (userId) => {
      const uid = await requireAuth();
      if (userId === uid) return;
      // If they've already asked us, treat this as "accept" — avoids the
      // awkward case where both sides hit "Add friend" in sequence.
      if (incomingFriendRequests.includes(userId)) {
        await acceptFriendRequestInternal(uid, userId);
        return;
      }
      if (
        friendIds.includes(userId) ||
        outgoingFriendRequests.includes(userId)
      ) {
        return;
      }
      const batch = writeBatch(db);
      batch.update(doc(db, "users", uid), {
        outgoingFriendRequests: arrayUnion(userId),
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, "users", userId), {
        incomingFriendRequests: arrayUnion(uid),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    },
    // `acceptFriendRequestInternal` is stable across renders (declared
    // below) so we deliberately leave it out of the deps list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, requireAuth, friendIds, outgoingFriendRequests, incomingFriendRequests]
  );

  const cancelFriendRequest = useCallback<AppStore["cancelFriendRequest"]>(
    async (userId) => {
      const uid = await requireAuth();
      if (!outgoingFriendRequests.includes(userId)) return;
      const batch = writeBatch(db);
      batch.update(doc(db, "users", uid), {
        outgoingFriendRequests: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, "users", userId), {
        incomingFriendRequests: arrayRemove(uid),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    },
    [db, requireAuth, outgoingFriendRequests]
  );

  /**
   * Shared core used by both `acceptFriendRequest` and the "send request
   * when there's already an incoming one" shortcut in `sendFriendRequest`.
   * Assumes caller already resolved `uid` via `requireAuth()`.
   */
  const acceptFriendRequestInternal = useCallback(
    async (uid: string, otherUserId: string) => {
      const batch = writeBatch(db);
      // My side: add them to friendIds, drop their request from my inbox.
      batch.update(doc(db, "users", uid), {
        friendIds: arrayUnion(otherUserId),
        incomingFriendRequests: arrayRemove(otherUserId),
        updatedAt: serverTimestamp(),
      });
      // Their side: add me to their friendIds, clear me from their outbox.
      // This pair of field changes is what the `isAcceptFriendRequest`
      // rule allows for a cross-user update.
      batch.update(doc(db, "users", otherUserId), {
        friendIds: arrayUnion(uid),
        outgoingFriendRequests: arrayRemove(uid),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    },
    [db]
  );

  const acceptFriendRequest = useCallback<AppStore["acceptFriendRequest"]>(
    async (userId) => {
      const uid = await requireAuth();
      if (!incomingFriendRequests.includes(userId)) return;
      await acceptFriendRequestInternal(uid, userId);
    },
    [requireAuth, incomingFriendRequests, acceptFriendRequestInternal]
  );

  const declineFriendRequest = useCallback<AppStore["declineFriendRequest"]>(
    async (userId) => {
      const uid = await requireAuth();
      if (!incomingFriendRequests.includes(userId)) return;
      const batch = writeBatch(db);
      batch.update(doc(db, "users", uid), {
        incomingFriendRequests: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });
      // Their side: drop me from their outbox so the UI reflects the
      // rejection on their next render.
      batch.update(doc(db, "users", userId), {
        outgoingFriendRequests: arrayRemove(uid),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    },
    [db, requireAuth, incomingFriendRequests]
  );

  const removeFriend = useCallback<AppStore["removeFriend"]>(
    async (userId) => {
      const uid = await requireAuth();
      if (!friendIds.includes(userId)) return;
      const batch = writeBatch(db);
      batch.update(doc(db, "users", uid), {
        friendIds: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, "users", userId), {
        friendIds: arrayRemove(uid),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
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

  // Returns the deterministic chat id for (currentUser, otherUser) without
  // writing anything to Firestore. The chat document itself is created
  // lazily by `sendMessage` when the first message is sent, so opening the
  // chat detail view for a user you've never messaged doesn't pollute the
  // Chats list with empty conversations.
  const startOrGetChat = useCallback<AppStore["startOrGetChat"]>(
    async (otherUserId) => {
      const uid = await requireAuth();
      if (otherUserId === uid) {
        throw new Error("Cannot start a chat with yourself");
      }
      return chatIdFor(uid, otherUserId);
    },
    [requireAuth]
  );

  const sendMessage = useCallback<AppStore["sendMessage"]>(
    async (chatId, content) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const uid = await requireAuth();

      // Chat ids encode the two participant uids (sorted, joined by "__").
      // Recover them so we can create the chat doc on the first message.
      const parts = chatId.split("__");
      if (parts.length !== 2 || !parts.includes(uid)) {
        throw new Error(`Invalid chat id for current user: ${chatId}`);
      }
      const participantIds = [parts[0], parts[1]].sort();

      // Idempotently ensure the chat doc exists before we write the message.
      // - On first send: this is a create, satisfying the chats `create` rule
      //   (participantIds.size == 2 and uid is a participant).
      // - On subsequent sends: this is an update that refreshes the
      //   lastMessage* preview fields.
      // Must run (and server-commit) BEFORE addDoc, because the messages
      // `create` rule reads the chat doc via get() to verify the sender is
      // a participant.
      await setDoc(
        doc(db, "chats", chatId),
        {
          participantIds,
          createdAt: serverTimestamp(),
          lastMessagePreview: trimmed.slice(0, 120),
          lastMessageAt: serverTimestamp(),
          lastMessageSenderId: uid,
        },
        { merge: true }
      );
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: uid,
        content: trimmed,
        createdAt: serverTimestamp(),
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
    incomingFriendRequests,
    outgoingFriendRequests,
    getUser,
    getPost,
    getGame,
    getChat,
    getChatWithUser,
    isFriend,
    getFriendshipStatus,
    canSeePrivateContentFrom,
    updateProfile,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
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
