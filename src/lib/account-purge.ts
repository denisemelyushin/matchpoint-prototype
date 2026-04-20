// Client-side "delete all my data" routine.
//
// Run this *before* calling Firebase Auth's `deleteUser()` — we still need a
// valid auth session to pass the Firestore security rules. It walks every
// collection the user touches and either deletes the docs they own outright,
// or surgically removes them from shared docs (e.g. leaving a game they were
// just a player in, clearing like/comment docs they created on other authors'
// posts).
//
// Scope:
//   - /users/{uid}                              → deleted
//   - /users/* (others) where uid is in          →  self-uid removed from each of:
//     friendIds / incomingFriendRequests /         friendIds / incomingFriendRequests /
//     outgoingFriendRequests                       outgoingFriendRequests
//   - /posts/{postId} where userId == uid       → deleted with all comments + likes
//   - /posts/*/comments where userId == uid     → deleted (and parent commentCount -1)
//   - /posts/*/likes   where userId == uid      → deleted (and parent likeCount -1)
//   - /games/{gameId}  where userId == uid      → deleted (host disbands the game)
//   - /games where uid in playerIds, not host   → self-leave (uid removed, count -1)
//   - /chats/{chatId}  where uid in participants → all messages + chat doc deleted
//
// This is intentionally best-effort: if any single step throws, the error
// propagates so the caller can surface it, but partial progress is not
// rolled back (Firestore has no cross-collection transactions at this
// scope). The next sign-in by the same user will see an empty state — the
// Auth user is deleted immediately after a successful purge.
//
// Plan to migrate this to a Cloud Function (auth.user().onDelete) once the
// project moves to the Blaze plan, at which point this file can be deleted.

import {
  arrayRemove,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentReference,
  type Firestore,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

/** Delete a single doc, swallowing "already gone" errors. */
async function safeDelete(ref: DocumentReference): Promise<void> {
  try {
    await deleteDoc(ref);
  } catch (err) {
    // Surface anything that isn't a missing-doc race.
    if (err instanceof Error && /not-found/i.test(err.message)) return;
    throw err;
  }
}

/**
 * Delete every document in a collection path. Used for post subcollections
 * where the user is the post author — we can nuke the whole subcollection
 * without filtering by userId because the post itself is going away.
 */
async function deleteAllInCollection(
  db: Firestore,
  parentPath: string,
  sub: "comments" | "likes"
): Promise<void> {
  const snap = await getDocs(collection(db, `${parentPath}/${sub}`));
  await Promise.all(snap.docs.map((d) => safeDelete(d.ref)));
}

async function purgeOwnPosts(db: Firestore, uid: string): Promise<void> {
  const ownPosts = await getDocs(
    query(collection(db, "posts"), where("userId", "==", uid))
  );
  // Tear down subcollections first, then the post itself.
  for (const p of ownPosts.docs) {
    const postPath = `posts/${p.id}`;
    await Promise.all([
      deleteAllInCollection(db, postPath, "comments"),
      deleteAllInCollection(db, postPath, "likes"),
    ]);
    await safeDelete(p.ref);
  }
}

async function purgeLikesByUser(db: Firestore, uid: string): Promise<void> {
  // Likes this user made on *other* authors' posts. The doc id equals the
  // uid, but we still have to query by field so Firestore returns the
  // parent path.
  const likes = await getDocs(
    query(collectionGroup(db, "likes"), where("userId", "==", uid))
  );
  await Promise.all(
    likes.docs.map(async (l) => {
      const postRef = l.ref.parent.parent;
      await safeDelete(l.ref);
      if (postRef) {
        try {
          await updateDoc(postRef, { likeCount: increment(-1) });
        } catch {
          // The parent post may be gone already (e.g. author deleted it).
          // Ignore — the like doc has been cleared, which is the main goal.
        }
      }
    })
  );
}

async function purgeCommentsByUser(db: Firestore, uid: string): Promise<void> {
  const comments = await getDocs(
    query(collectionGroup(db, "comments"), where("userId", "==", uid))
  );
  await Promise.all(
    comments.docs.map(async (c) => {
      const postRef = c.ref.parent.parent;
      await safeDelete(c.ref);
      if (postRef) {
        try {
          await updateDoc(postRef, { commentCount: increment(-1) });
        } catch {
          // See purgeLikesByUser — parent post may be gone; ignore.
        }
      }
    })
  );
}

async function purgeGames(db: Firestore, uid: string): Promise<void> {
  // Games hosted by this user → delete outright.
  const hosted = await getDocs(
    query(collection(db, "games"), where("userId", "==", uid))
  );
  await Promise.all(hosted.docs.map((g) => safeDelete(g.ref)));

  // Games where this user is merely a player → self-leave.
  const joined = await getDocs(
    query(collection(db, "games"), where("playerIds", "array-contains", uid))
  );
  await Promise.all(
    joined.docs.map(async (g) => {
      const data = g.data();
      if (data.userId === uid) return; // already deleted above
      const nextIds: string[] = (data.playerIds as string[]).filter(
        (id) => id !== uid
      );
      await updateDoc(g.ref, {
        playerIds: nextIds,
        playerCount: nextIds.length,
      });
    })
  );
}

/**
 * Remove references to this user from every other user's social graph —
 * friendIds, incomingFriendRequests, outgoingFriendRequests. These are
 * cross-user writes, but the `isUnfriend` / `isCancelFriendRequest` /
 * `isDeclineFriendRequest` rules allow the caller to remove their own
 * uid from any of those three arrays on any other user's doc, which is
 * exactly what we need here.
 */
async function purgeFriendshipLinks(
  db: Firestore,
  uid: string
): Promise<void> {
  const fields = [
    "friendIds",
    "incomingFriendRequests",
    "outgoingFriendRequests",
  ] as const;
  for (const field of fields) {
    const snap = await getDocs(
      query(collection(db, "users"), where(field, "array-contains", uid))
    );
    await Promise.all(
      snap.docs
        .filter((d) => d.id !== uid)
        .map((d) =>
          updateDoc(d.ref, {
            [field]: arrayRemove(uid),
            updatedAt: serverTimestamp(),
          })
        )
    );
  }
}

async function purgeChats(db: Firestore, uid: string): Promise<void> {
  const chats = await getDocs(
    query(
      collection(db, "chats"),
      where("participantIds", "array-contains", uid)
    )
  );
  for (const c of chats.docs) {
    const messages = await getDocs(collection(db, `chats/${c.id}/messages`));
    await Promise.all(messages.docs.map((m) => safeDelete(m.ref)));
    await safeDelete(c.ref);
  }
}

/**
 * Remove every trace of `uid` from Firestore. Call while the user is still
 * authenticated. Throws on the first unrecoverable failure — the caller
 * should surface the error and NOT proceed to `deleteUser()`.
 */
export async function purgeUserData(uid: string): Promise<void> {
  const db = getFirebaseDb();

  // Order matters: clean up references to this user on *other* authors'
  // content first, then delete the user's own owned docs. This keeps
  // counters on surviving posts accurate.
  await purgeLikesByUser(db, uid);
  await purgeCommentsByUser(db, uid);
  await purgeGames(db, uid);
  await purgeChats(db, uid);
  await purgeFriendshipLinks(db, uid);
  await purgeOwnPosts(db, uid);

  // Finally the profile doc itself.
  await safeDelete(doc(db, "users", uid));
}
