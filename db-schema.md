# Database Schema (Firebase / Firestore)

This document describes the Firestore schema used by Matchpoint Pro. It is the single source of truth for collections, documents, and fields the app reads and writes. Keep it in sync with the app's data model — if `src/lib/types.ts`, the app store, or any read/write in `src/app` changes, update this file in the **same** commit.

Firebase Auth is used for sign-in; the Auth `uid` is reused as the `users/{userId}` document ID so every authenticated user maps 1:1 to a user doc.

---

## Conventions

- **IDs**: document IDs are short, URL-safe strings.
  - `users/{userId}` — matches Firebase Auth `uid`.
  - `posts/{postId}`, `games/{gameId}` — auto-generated IDs.
  - `chats/{chatId}` — deterministic, derived from the two participants: `sortedJoin(uidA, uidB, "__")`. This guarantees a single chat per pair and lets the client look a chat up without querying.
- **Timestamps**: stored as Firestore `Timestamp`. Fields ending in `At` (e.g. `createdAt`, `lastMessageAt`) are `Timestamp`. The client converts to `number` (epoch ms) when needed.
- **References**: other documents are referenced by ID (`userId`, `playerIds[]`), never by `DocumentReference`, to keep payloads portable.
- **Denormalisation**: counters and recent-activity previews (`likeCount`, `commentCount`, `lastMessagePreview`) are stored on the parent doc to avoid fan-out reads on list screens. They are kept consistent via transactions or a single batched write at mutation time — never relied on to be perfectly accurate; the subcollection is authoritative.
- **Booleans**: default to `false` and are always present (no `undefined` booleans in Firestore — write an explicit value).

---

## Collection map

```
users/{userId}
  └── (no subcollections)

posts/{postId}
  ├── comments/{commentId}
  └── likes/{userId}          // presence = liked

games/{gameId}
  └── (no subcollections)

chats/{chatId}
  └── messages/{messageId}
```

---

## `users/{userId}`

The user's public profile and app-level preferences. Created on first sign-in.

| Field          | Type            | Required | Notes                                                                                      |
| -------------- | --------------- | :------: | ------------------------------------------------------------------------------------------ |
| `name`         | `string`        |    ✓     | Display name shown throughout the app.                                                     |
| `email`        | `string`        |    ✓     | Lower-cased. Mirrored from Firebase Auth.                                                  |
| `bio`          | `string`        |    ✓     | May be empty string. Shown on profile and player cards.                                    |
| `skillLevel`   | `string` (enum) |    ✓     | One of `"Beginner" \| "Intermediate" \| "Advanced" \| "Pro"`.                              |
| `initials`     | `string`        |    ✓     | 1–2 character fallback for the avatar. Derived from `name` on write.                       |
| `avatarUrl`    | `string`        |          | Optional; absent while the user has no photo.                                              |
| `friendIds`    | `string[]`      |    ✓     | Mutual friendships. Bounded to a small number for the prototype; migrate to a subcollection if it grows. |
| `createdAt`    | `Timestamp`     |    ✓     | Set on user doc creation.                                                                  |
| `updatedAt`    | `Timestamp`     |    ✓     | Bumped on every profile edit.                                                              |

**Indexes**: none beyond the defaults.

---

## `posts/{postId}`

A feed post. Visible to everyone unless `isPrivate`, in which case only the author sees it.

| Field          | Type            | Required | Notes                                                                                      |
| -------------- | --------------- | :------: | ------------------------------------------------------------------------------------------ |
| `userId`       | `string`        |    ✓     | Author. References `users/{userId}`.                                                       |
| `content`      | `string`        |    ✓     | Body text. Non-empty.                                                                      |
| `imageUrl`     | `string`        |          | Optional attached image (Firebase Storage URL).                                            |
| `location`     | `string`        |          | Free-text location label (e.g. court name).                                                |
| `isPrivate`    | `boolean`       |    ✓     | `true` = only author sees it.                                                              |
| `likeCount`    | `number`        |    ✓     | Denormalised count. Authoritative source is `posts/{postId}/likes`.                         |
| `commentCount` | `number`        |    ✓     | Denormalised count. Authoritative source is `posts/{postId}/comments`.                      |
| `createdAt`    | `Timestamp`     |    ✓     | Set on creation, never edited.                                                             |

**Indexes**:
- `createdAt DESC` — feed timeline (default, no composite index needed).
- `userId ASC, createdAt DESC` — "my posts" on the profile screen.

### `posts/{postId}/comments/{commentId}`

| Field        | Type        | Required | Notes                                    |
| ------------ | ----------- | :------: | ---------------------------------------- |
| `userId`     | `string`    |    ✓     | Comment author.                          |
| `content`    | `string`    |    ✓     | Non-empty body.                          |
| `createdAt`  | `Timestamp` |    ✓     | Set on creation.                         |

### `posts/{postId}/likes/{userId}`

Presence of a doc at this path means `userId` liked the post. Keeps like state per user without a separate query.

| Field       | Type        | Required | Notes                               |
| ----------- | ----------- | :------: | ----------------------------------- |
| `createdAt` | `Timestamp` |    ✓     | When the like happened.             |

---

## `games/{gameId}`

A scheduled match. Visible to everyone unless `isPrivate`.

| Field         | Type            | Required | Notes                                                                                |
| ------------- | --------------- | :------: | ------------------------------------------------------------------------------------ |
| `userId`      | `string`        |    ✓     | Host (creator). Always present in `playerIds`.                                       |
| `court`       | `string`        |    ✓     | Court label. Either one of the built-in courts or a user-entered custom one.         |
| `date`        | `Timestamp`     |    ✓     | Start time.                                                                          |
| `minSkill`    | `string` (enum) |    ✓     | `"Beginner" \| "Intermediate" \| "Advanced" \| "Pro"`.                               |
| `maxPlayers`  | `number`        |    ✓     | Integer, ≥ 2.                                                                        |
| `notes`       | `string`        |          | Optional free-text notes.                                                            |
| `isPrivate`   | `boolean`       |    ✓     | `true` = only the host and invited players see it.                                   |
| `playerIds`   | `string[]`      |    ✓     | Includes the host. Length is bounded by `maxPlayers`.                                |
| `playerCount` | `number`        |    ✓     | Equal to `playerIds.length`. Denormalised for list queries / "game full" checks.     |
| `createdAt`   | `Timestamp`     |    ✓     | Set on creation, never edited.                                                       |

**Indexes**:
- `date ASC` — Games tab (Upcoming / Today / Tomorrow / Weekend).
- `playerIds ARRAY_CONTAINS, date ASC` — "games I'm in" on profile.

---

## `chats/{chatId}`

A 1:1 conversation. `chatId` is deterministic from the pair so each pair has exactly one chat document.

| Field                 | Type              | Required | Notes                                                                         |
| --------------------- | ----------------- | :------: | ----------------------------------------------------------------------------- |
| `participantIds`      | `string[]`        |    ✓     | Exactly two user IDs, sorted ascending. Matches `chatId` derivation.           |
| `lastMessagePreview`  | `string`          |          | Truncated copy of the most recent message. Absent until the first message.     |
| `lastMessageAt`       | `Timestamp`       |          | Set on every new message; used to sort the Chats list.                        |
| `lastMessageSenderId` | `string`          |          | Who sent the most recent message.                                             |
| `createdAt`           | `Timestamp`       |    ✓     | Set on creation.                                                              |

**Indexes**:
- `participantIds ARRAY_CONTAINS, lastMessageAt DESC` — listing a user's chats by recency.

### `chats/{chatId}/messages/{messageId}`

| Field       | Type        | Required | Notes                                         |
| ----------- | ----------- | :------: | --------------------------------------------- |
| `senderId`  | `string`    |    ✓     | Must be one of the chat's `participantIds`.    |
| `content`   | `string`    |    ✓     | Non-empty body.                                |
| `createdAt` | `Timestamp` |    ✓     | Set on creation, never edited.                 |

**Indexes**: `createdAt ASC` (default).

---

## Security rules (sketch)

Firestore rules should enforce:

- `users/{userId}`: anyone signed in can read; only the owner can write (`request.auth.uid == userId`).
- `posts/{postId}`:
  - **Read**: public posts are world-readable (signed in). Private posts readable only by the author (`resource.data.userId == request.auth.uid`).
  - **Write**: only the author can create / update / delete; `userId` is forced to `request.auth.uid` on create.
  - `comments`: any signed-in user can create their own comment (`request.resource.data.userId == request.auth.uid`); only the comment author (or post author) can delete.
  - `likes/{userId}`: only `request.auth.uid == userId` can create or delete that like document.
- `games/{gameId}`: similar rules to posts. `playerIds` can only be mutated via join/leave flows that require the acting user to be in / not in the array, and length must stay ≤ `maxPlayers`.
- `chats/{chatId}`: both read and write restricted to users whose `uid` appears in `participantIds`. On create, `participantIds` must contain `request.auth.uid` and the computed `chatId` must match the deterministic derivation so pairs can't fork into multiple chats.
- `chats/{chatId}/messages/{messageId}`: create-only for participants; `senderId` must equal `request.auth.uid`. Edits/deletes not permitted from the client.

Detailed rules live in `firestore.rules` once Firebase is wired up.

---

## Field-level validation (client contract)

These constraints are enforced in the app today and should also be enforced in rules:

- `users.name`: 1–60 chars.
- `users.bio`: ≤ 280 chars.
- `posts.content`, `comments.content`, `messages.content`: 1–1000 chars.
- `games.notes`: ≤ 500 chars.
- `games.maxPlayers`: integer, 2–8.
- `games.playerIds.length ≤ games.maxPlayers` at all times.
- `chats.participantIds.length == 2` and sorted ascending.

---

## Seed / demo data

The prototype currently ships with an in-memory seed (see `src/lib/app-store.tsx`). When migrating to Firestore, the initial dataset should be loaded once via an admin script; the client should not create seed data at runtime.
