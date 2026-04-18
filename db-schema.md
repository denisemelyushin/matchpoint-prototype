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

| Field       | Type        | Required | Notes                                                                    |
| ----------- | ----------- | :------: | ------------------------------------------------------------------------ |
| `userId`    | `string`    |    ✓     | Redundant with the doc ID, but required so `collectionGroup("likes")` queries can filter by the liking user. |
| `createdAt` | `Timestamp` |    ✓     | When the like happened.                                                  |

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

## Security rules

The live rules live in `firestore.rules` and are deployed to the project via `npm run db:deploy-rules` (uses the Admin SDK service-account credentials — no `firebase login` required).

Current policy:

- **`users/{userId}`** — public read (guest-friendly); only the owner can create / update. Deletes disabled.
- **`posts/{postId}`** — public read (the `isPrivate` flag is enforced as a client-side display filter only; Firestore list queries can't evaluate doc-field-dependent rules cleanly in a prototype). Create / delete only by author; updates by author or by any signed-in user changing only the denormalised `likeCount` / `commentCount`.
  - **`comments`**: public read; create by any signed-in user with `userId == request.auth.uid`; delete by the comment author only. Also reachable via a collection-group rule (`match /{path=**}/comments/{commentId}`).
  - **`likes/{userId}`**: public read; create / delete only by `userId == request.auth.uid`. Also reachable via a collection-group rule (`match /{path=**}/likes/{likeId}`).
- **`games/{gameId}`** — public read (privacy is client-side for the prototype). Create by host with `userId == request.auth.uid`. Updates restricted to the host OR a valid self-join / self-leave on `playerIds` + `playerCount` that respects `maxPlayers`.
- **`chats/{chatId}`** — read / write only for users whose uid is in `participantIds`. On create, the caller must be one of the two participants. Deletes disabled.
- **`chats/{chatId}/messages/{messageId}`** — read / create only for chat participants; `senderId` must equal `request.auth.uid`. Edits / deletes not permitted from the client.

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

Demo users, posts, comments, likes, and games are loaded into Firestore via `scripts/seed.ts` (run with `npm run db:seed`). The script uses the Firebase Admin SDK and the service-account key pointed to by `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env.local`. The client no longer creates seed data at runtime — it only subscribes to Firestore.

`scripts/inspect.ts` (`npm run db:inspect`) prints collection counts to verify a seed.

---

## Operational scripts

| Script                        | Command                   | Purpose                                                                 |
| ----------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| `scripts/seed.ts`             | `npm run db:seed`         | Populate Firestore with the demo dataset.                               |
| `scripts/inspect.ts`          | `npm run db:inspect`      | Print counts of top-level collections for a sanity check.               |
| `scripts/deploy-rules.ts`     | `npm run db:deploy-rules` | Publish `firestore.rules` and attempt to create `firestore.indexes.json` indexes via the Firebase Rules / Firestore Admin REST APIs using the Admin SDK access token. |

> Note: deploying composite indexes via the service account requires the `roles/datastore.indexAdmin` (or `roles/datastore.owner`) role on the project. Without it the script will log a 403 for the index calls and the corresponding queries may need to be created once in the Firebase console.
