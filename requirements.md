# Matchpoint Pro — Prototype Requirements

A mobile-first web app prototype for connecting pickleball players. This document describes the full set of functional and non-functional requirements for the prototype.

---

## 1. Platform & Tech

- Built with **Next.js** (App Router) and **TypeScript**.
- Styled with **Tailwind CSS**.
- Must be openable in a **mobile device browser**.
- On desktop browsers, the app is constrained to a **`max-width` of 480px**, centered, to preserve a mobile-app look.
- **Firebase** is the backend:
  - **Firestore** for all app data (users, posts with comments/likes, games, chats with messages). Schema is tracked in `db-schema.md` and security rules live in `firestore.rules`.
  - **Firebase Authentication** (email + password) for account creation and sign-in. The Auth `uid` is reused as the `users/{userId}` document ID.
- Web SDK config ships in `.env.local` (and `.env.example` for newcomers). The Admin SDK service-account key path is set via `FIREBASE_SERVICE_ACCOUNT_PATH` for local scripts only; the key itself is `.gitignore`d.
- Deployed to **Vercel**, published from the `main` branch of the GitHub repository.

## 2. Design System

- **Default look-and-feel** is the Strava-inspired **Midnight Lime** theme: near-black background (`#0A0A0A`), slightly lighter greys for surfaces, and a neon pickleball-green primary accent (`#96FE17`) used for primary buttons, active tab, highlights, and links. Modern, clean, content-forward, with rounded cards and generous spacing.
- The app ships with **five swappable themes** (see §16 for the picker), each inspired by a popular sport or social app and covering a distinct mood — four dark themes and one light theme. The default theme is Midnight Lime (Strava).
- Every theme ships the same set of CSS custom properties (`--app-bg`, `--app-fg`, `--app-primary`, `--app-primary-dark`, `--app-primary-on`, `--app-accent`, `--app-surface`, `--app-surface-light`, `--app-muted`, `--app-border`, `--app-font-body`) so changing one instantly re-skins the whole app without any component-level branching.
- Typography: Geist Sans by default; the Jet Noir theme switches the body stack to the iOS system font (`-apple-system, SF Pro Text, …`).
- Mobile-native touches: active-scale tap feedback, bottom-safe-area padding, no browser scrollbars, no tap highlight.

## 3. Global Behavior

- The **Onboarding** flow (which now includes the branded welcome slide as its first step) must **not scroll vertically** and must **not trigger pull-to-refresh** or rubber-band overscroll.
- Main app screens (Feed, Games, Players, Chats, and all sub-screens) may scroll vertically but must suppress pull-to-refresh.
- App data (profile, posts, comments, likes, games, chats, messages) lives in **Firestore** and is streamed into a single React context via real-time subscriptions; UI-only preferences (theme, app-bar / menu-profile / tab-bar variants) remain in `localStorage`.
- **All absolute dates and times are rendered in the viewer's local timezone.** A game scheduled for 6:00 PM Pacific appears as `6:00 PM` for a viewer in PT and `9:00 PM` for a viewer in ET — the stored moment is the same, only the wall-clock presentation differs. `Today / Yesterday / Tomorrow` boundaries, chat day separators, and game filters all follow the viewer's local calendar day.

### 3.1 Guest mode & auth gating

- The app is **usable without signing in**. A guest can browse the Feed, open posts, explore Games, the Players directory, and any user profile.
- **Interactive actions require an account** and open a modal sign-up / sign-in sheet if the user is currently a guest. The gated actions are:
  - Creating a post, a game, or a new chat (`+` button on any tab).
  - Editing the current user's profile / visiting `/profile`.
  - Liking or commenting on a post.
  - Joining or leaving a game.
  - Adding / removing a friend.
  - Sending a message or opening a chat with another player.
- The auth modal supports switching between **Sign up** (name, email, password) and **Sign in** (email, password). On success it closes and resumes the action the user initiated.
- The **slide menu** shows either the logged-in user's profile card or, for guests, a "Sign in" entry; a **Log out** entry appears when signed in and returns the user to guest mode (content still visible, gated actions re-prompt).

---

## 4. Root redirect (`/`)

The root route renders nothing visible — it's a thin auth-gate redirect:

- Signed-in users are forwarded to **`/feed`**.
- Guests (including users who just signed out or deleted their account) are forwarded to **`/onboarding`**.

There is no standalone welcome page anymore; the branded welcome content now lives as the first slide of the onboarding flow (see §5).

## 5. Onboarding Flow (`/onboarding`)

A six-slide horizontal carousel. The first slide is the branded **welcome** screen (logo + tagline + **Get Started** CTA); the remaining five slides introduce features.

- The primary CTA button sits near the bottom of the screen in a fixed position across all slides. Its label is:
  - **Get Started** on the welcome slide (step 0),
  - **Next** on steps 1–4,
  - **Let's Go!** on the final step.
- **Step indicator dots** appear above the button, showing progress across all six slides; tapping a dot jumps directly to that step.
- **Swipe gestures** are supported on every slide (including the welcome slide):
  - Drag left → go to the next step.
  - Drag right → go to the previous step.
  - Live finger-follow with rubber-band resistance at the first and last steps.
  - Vertical drags are ignored (axis locking).
- No **Skip** button.
- After the final step, the user lands on the **Feed** tab.

**Onboarding slide content:**

| # | Title | Description |
|---|---|---|
| 0 | (welcome slide) | Logo + tagline: "Find courts. Play games. Connect with players." |
| 1 | Find Courts Near You | Discover nearby pickleball courts and see where others are playing. |
| 2 | Schedule & Join Games | Create games or join open matches in your area. |
| 3 | Stay Connected with Players | Message players and coordinate games easily. |
| 4 | Share the Game | Post your games and see your friends playing on the social feed. |
| 5 | Let's Get You on the Court! | Start exploring the app. |

---

## 6. App Shell (main app)

The main app has a persistent layout:

- **Top app bar** — fixed layout on every main tab: a large (30 px) burger icon in the top-left opens the slide-out menu, a fixed **"MatchPoint Pro"** brand label sits in the centre on every tab, and a large (30 px) plus icon in the top-right creates new content for the active tab — a new post on Feed, a new game on Games, a new chat on Chats. The plus button is hidden on the Players tab; an equal-width spacer is rendered so the brand label stays centred. Tapping **Add** pushes the creation screen (`/post/new`, `/game/new`, `/chat/new`); hitting the back arrow on any of those screens returns to the originating tab because each tab is its own top-level route (`/feed`, `/games`, `/players`, `/chats`) — so the browser back stack naturally points at the tab the user was on (e.g. Games → `/game/new` → Back → `/games`).
- **Bottom tab bar** — a rounded capsule **floating dock** detached from the bottom edge with a soft shadow, containing four tabs (in order):
  1. **Feed**
  2. **Games**
  3. **Players**
  4. **Chats**

  Active tab is highlighted with a primary-tinted rounded pill and primary-coloured icon + label; inactive tabs are muted grey.

## 7. Slide Menu

Uses an **underlay drawer** pattern (iOS-style side drawer): the menu and the main app shell sit on separate layers inside the 480px mobile frame. The menu is stationary, anchored to the left edge of the frame on a lower layer. The main shell sits on a higher layer and slides to the **right** by the menu's width (300px) to reveal the menu underneath.

Open / close behavior:

- Open: triggered by the top-left Menu button. Over ~400ms with a smooth easing curve, the main app shell translates 300px to the right (revealing the menu beneath) and picks up a soft shadow on its left edge. Its right portion is clipped by the phone frame, leaving a narrow peek of main content. The menu itself does not animate — it is already in place underneath.
- Close: tapping anywhere on the offset main content, or pressing **Escape**, slides the main shell back into place, hiding the menu again.
- There is no visible scrim and no explicit close button — the offset main content itself is the tap-to-close affordance.

Menu contents, from top to bottom:

1. **Profile card** at the top — an outlined card with a thin border and no filled background, showing the current user's avatar (52 px), name, and email. The whole tile is a single tap target that opens the Edit Profile screen directly; there is never a separate edit button.
2. **Settings** link — opens the Settings screen (see §16).
3. **Privacy Policy** link (opens a page).
4. **Terms of Use** link (opens a page).
5. **Log Out** button — signs the user out and returns them to the onboarding flow (which opens on the branded welcome slide).

---

## 8. Profile

### 8.1 Profile screen (`/profile`)
- Header with back button and title.
- Shows:
  - Large avatar
  - Name
  - Email
  - **Skill level** badge
  - Bio
  - Edit Profile button
- Lists the current user's own posts below the profile header.

### 8.2 Edit Profile screen (`/profile/edit`)
User can edit:
- **Name** (required)
- **Avatar** (upload from device; tap-to-change)
- **Bio** (free-form text, up to 240 characters)
- **Skill level** (one of: Beginner, Intermediate, Advanced, Pro)

Header has a **Save** action that persists changes and returns to the previous screen.

At the bottom of the screen, below a separator, there is a subtle **Delete account** text link. It is intentionally low-contrast (muted grey, no background, no icon) — it only picks up a soft rose tint on press. Tapping it opens the in-app confirmation dialog ("Delete your account?" with a destructive "Delete account" button). On confirm a second in-app dialog asks the user to re-enter their password — this is required so the deletion is always authorised with a fresh credential regardless of how long the session has been open. On submit we reauthenticate, then run a client-side purge that deletes every document the user owns or participates in (profile, posts and their comments + likes, hosted games, chats and their messages) and removes the user from any game they were merely a player in, then delete the Firebase Auth record. The user is then returned to the onboarding flow (which opens on the branded welcome slide). Wrong passwords surface inline in the dialog without closing it. (When the app later moves to the Blaze plan, this client-side purge is intended to be replaced with an `onDelete` Cloud Function or the `firebase/delete-user-data` extension.)

---

## 9. Feed (first tab)

### 9.1 Feed list
Shows user posts in chronological order (newest first). Each **post** card shows:
- User avatar
- User name
- Relative date (e.g. "15 min ago", "2 hrs ago")
- **Location** (optional, e.g. "Riverside Courts")
- Text content (optional)
- **Posted image** (optional)
- **Likes** count with a heart toggle
- **Comments** count

Private posts (visible only to the author and their friends) show a small muted lock icon in the top-right corner of the post header, both in the feed list and on the post detail screen.

### 9.2 Like / Unlike
- Tapping the heart toggles the like state and updates the count live.

### 9.3 Comments
- Tapping the comments count or a post card opens the **Post Detail** screen (`/post/[id]`).
- Post Detail shows the full post plus **all comments** on a dedicated full-screen view.
- A text input is always visible at the bottom; users can send a new comment (Enter to send; Send button).

### 9.4 Create post (`/post/new`)
Opened from the top-right **Add** button on the Feed tab. Users can:
- Enter text content.
- Add an **image** (optional; picked from device).
- Add a **location** (optional, free text).
- Toggle visibility: **Public** or **Private**.

Header has a **Post** action. Post must have either text or an image to be created.

---

## 10. Games (second tab)

### 10.1 Games list
Shows public games (and the current user's private games) filtered by a segmented time toggle at the top of the tab. The toggle has four chips, laid out as equal-width pills in a rounded container:
- **Upcoming** (default) — strictly future games. Any game whose scheduled start time has already passed is hidden here (so games from earlier today that have finished, or games that drifted into the past, never appear).
- **Today** — games whose date falls on the current local day (including games earlier today that have already finished — useful for retrospect).
- **Tomorrow** — games whose date falls on the next local day.
- **Weekend** — games whose date falls on the upcoming Saturday and/or Sunday and whose start time is still in the future. If today is Saturday, both Saturday and Sunday are included; if today is Sunday, only Sunday is included; otherwise the next Sat–Sun are included.

Within every filter the games are sorted by **date ascending** (soonest first). Each filter shows a contextual empty state when no games match.

Each **game card** shows:
- Host: name, avatar.
- A small indicator for private games (lock icon).
- A pill showing spots remaining or "Full".
- Main info block organized for scannability:
  - **Date & time headline**: plain text (no icon) combining the date and time joined by a muted middle-dot. When the game falls on a nearby day the day portion collapses to a relative word (`Today`, `Tomorrow`, or `Yesterday` for just-past games) with the absolute date omitted — e.g. `Today · 9:00 AM`. For any other date the short absolute date is used instead — e.g. `Sat, Apr 18 · 9:00 AM`. The `Today / Yesterday / Tomorrow` boundary follows the user's **local** calendar day (not UTC), so labels always match the segmented filter above. Both the day and time share the prominent headline treatment; the separator stays muted.
  - **Court row**: small muted map-pin icon + court name.
  - A chip row with **minimum skill level** (e.g. `INTERMEDIATE+`) and **players joined / max players** (e.g. `3/4 PLAYERS`).
  - **Notes** (optional) below the chip row.

### 10.2 Join button
Every game card shows a single primary action button whose state depends on the current user:
- **Join game** — shown when there are free slots and the user has not joined. Tapping it adds the user to the game.
- **Joined** — shown when the user is already a participant (and is not the host). Tapping confirms and lets the user leave the game.
- **Game full** — shown as a disabled state when all slots are occupied and the user has not joined.
- **You're hosting** — shown as a disabled state when the current user is the host of the game.

### 10.3 Create game (`/game/new`)
Opened from the top-right **Add** button on the Games tab. Fields:
- **Court** — dropdown of preset courts, with a "+ Add custom court" option that reveals a free-text input.
- **Date & time** (native datetime picker).
- **Min skill level** (Beginner / Intermediate / Advanced / Pro).
- **Max players** (2–16).
- **Notes** (optional).
- **Visibility**: Public / Private.

Header has a **Create** action. The host is automatically added as the first player.

---

## 11. Players (third tab)

- Lists users other than the current user, sorted alphabetically (A→Z) by name using locale-aware, case-insensitive comparison.
- At the top of the tab content, a pill **segmented toggle** switches between two filters:
  - **All players** (default) — every other user in the directory.
  - **My friends** — only users the current user has added as a friend.
  The selected option is filled with the primary colour; the other is plain muted text on a subtle pill background. The list re-renders instantly when the filter changes, preserving A→Z order. If the resulting list is empty, an inline empty state is shown (e.g. "No friends yet. Add players from All players." for the friends filter).
- Each player card shows:
  - Avatar
  - Name
  - Skill level badge (rendered on its own line directly below the name)
  - Bio (truncated)
  - A **friend toggle** button on the right. When the user is not yet a friend, the button shows a muted outline "user with +" icon on a subtle neutral background; tapping adds them as a friend immediately. When they are already a friend, the button flips to a primary-tinted "user with check" icon; tapping it opens an in-app **confirmation dialog** ("Remove {name} from friends?", explanatory body, destructive Remove button, Cancel button, dismissable via backdrop or Escape) before the friend is removed. Tapping never navigates.
  - A **message** shortcut button (primary-tinted) next to the friend toggle that opens — or creates — a chat with that player.
- Friend relationships live in the app store under `friendIds: string[]` (a list of user IDs the current user has befriended). Helpers `isFriend(userId)` and `toggleFriend(userId)` back the player card button and the friends filter.

## 12. Chats (fourth tab)

### 12.1 Conversation list
Shows all existing conversations for the current user, sorted by most recent message. Each row shows:
- Other participant's avatar and name.
- Preview of the last message (prefixed with "You: " if sent by current user).
- Relative time of the last message.

### 12.2 Chat detail (`/chat/[id]`)
Full conversation view:
- Header with the other user's name and avatar and a back button. The back button always returns to the **Chats** tab of the main app (`/chats`) regardless of how the user arrived — it does not fall back to arbitrary browser history.
- Scrollable message list, auto-scrolling to the latest message.
- Message bubbles styled differently for mine (right, primary color) and theirs (left, surface color).
- **Bubble grouping**: consecutive messages from the same sender on the same day are stacked tightly (small top margin) and their connecting corner is flattened — the top-right for own messages, the top-left for received messages — mirroring the existing "tail" on the bottom corner so grouped bubbles read as a single stack. Outer corners use a 12px (`rounded-xl`) radius while tail and stack-facing corners use a gentler 8px (`rounded-lg`) — enough to soften middle-of-group bubbles without making standalone ones feel pill-shaped. When the sender changes ("turn change"), a larger vertical gap appears and the top corners return to the full 12px radius. This matches the cadence used by WhatsApp and Telegram.
- **Speech-bubble tail**: the last bubble of a same-sender run of *own* messages (including standalone own bubbles) renders a small curved tail extending outward from the bottom-right corner in the active primary color. The bubble's bottom-right corner is squared off (`rounded-br-none`) so the tail attaches seamlessly, making the bubble read like a call-out from the user. Intermediate bubbles in a stack never render a tail — only the final one in each group does. Received bubbles do not render a tail in this prototype.
- **Inline timestamps** in every bubble, placed in the bottom-right of the bubble in the style of WhatsApp/Telegram. The time uses the locale's short form (e.g. `2:34 PM`), is small (10px) and muted, and reserves invisible horizontal space on the last text line so it never overlaps the message content.
- **Day separators** between messages that fall on different days. Each separator is a centered muted pill above the first message of its day, labeled:
  - `Today` for the current day.
  - `Yesterday` for the previous day.
  - The weekday name (e.g. `Monday`) for anything within the last 7 days.
  - `April 12` / `April 12, 2024` for older messages (year appended only when it differs from the reference year).
  - The "today" anchor is the real wall-clock `Date.now()` at render time, so newly sent messages always read as `Today` and older days shift to `Yesterday` / weekday labels automatically.
- Composer at the bottom with placeholder "Message {first name}…".
- Enter to send.

### 12.3 New chat (`/chat/new`)
Opened from the top-right **Add** button on the Chats tab. Shows:
- A search input for filtering players by name or email.
- A list of all other users, sorted alphabetically by name (case-insensitive). Each row shows the player's avatar, name, and email — **no skill level** chip, since skill is not relevant when choosing someone to message.
- Selecting a player opens the chat detail screen with them and jumps to it. The underlying chat is **created lazily on the first message**, so opening a conversation with someone and then leaving without typing anything does not pollute the Chats list with an empty thread. A conversation only appears in the Chats list once at least one message has been sent.

---

## 13. Privacy & Visibility

- **Posts** can be marked Public or Private. Public posts are visible to everyone on the MatchPoint app; private posts are scoped to the author's friends.
- **Games** can be marked Public or Private. Public games are visible and joinable by everyone on the MatchPoint app; private games are scoped to the host's friends, who can see and join them.
- Private posts display a small muted lock icon in the top-right of the post header, on both the feed card and the post detail screen. Private games display a small lock icon in their game card.

---

## 14. Static Pages

- **Privacy Policy** (`/privacy`) — placeholder copy.
- **Terms of Use** (`/terms`) — placeholder copy.

---

## 15. Non-functional Requirements

- Must load instantly on mobile browsers (static where possible; Next.js App Router with RSC).
- Must feel native: tap feedback, smooth transitions (e.g. 300ms ease-out on step change, 400ms eased slide on the underlay drawer, etc.).
- No console errors or linter warnings on build.
- Images rendered fluidly without layout shift.
- Responsive to orientation and small-viewport heights.

---

## 16. Settings (`/settings`)

Reached from the **Settings** entry in the slide menu. Regular sub-page layout (back-arrow header, no bottom tab bar), so the user returns to whichever tab they were on previously.

Sections, in order:

- **App theme** — a picker of five named themes, each inspired by a popular sport or social app and covering a distinct mood. Options (in order):
  - **Midnight Lime** (default) — inspired by **Strava**. Performance athletic: deep black canvas, neon pickleball-green primary.
  - **Volt Slab** — inspired by **Nike Run Club**. Editorial brutalist: pure black + Volt lime, hard corners, oversized uppercase headings.
  - **Party Plum** — inspired by **Partiful**. Playful social: warm plum background with a hot-pink → tangerine gradient primary and softer, more rounded surfaces.
  - **Jet Noir** — inspired by **Apple Fitness+**. Calm iOS-native: jet-black canvas, iOS-green primary, iOS-neutral greys, system font stack.
  - **Court Green** — inspired by **Playtomic**. Court-native sporty **light mode**: crisp off-white canvas, tennis-green primary, clay-orange accent.

  Each option is rendered as a full-width tile: on the left a preview strip shows the theme's background, a surface tile, faux text bars, the accent dot, and the primary (or gradient) dot; on the right the tile labels the theme with its name, the app it's inspired by, and a one-line mood description. The active theme gets a primary-coloured ring and a check badge.

  Selecting a theme:
  - Instantly re-skins the entire app by swapping the `--app-*` CSS custom properties via `[data-theme="…"]` on `<html>`; some themes also adjust body type (uppercase headings for Volt Slab, tighter tracking for Jet Noir, gradient fills on primary buttons for Party Plum).
  - Persists the choice in `localStorage` under `matchpoint:theme` and is applied before hydration by a small inline script in the document head, so users don't get a flash of the default theme on reload.
  - Updates the mobile browser chrome colour (`<meta name="theme-color">`) to match.

The screen is a container for future account/app preferences; today it ships only the app theme picker.
