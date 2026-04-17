# Matchpoint Pro — Prototype Requirements

A mobile-first web app prototype for connecting pickleball players. This document describes the full set of functional and non-functional requirements for the prototype.

---

## 1. Platform & Tech

- Built with **Next.js** (App Router) and **TypeScript**.
- Styled with **Tailwind CSS**.
- Must be openable in a **mobile device browser**.
- On desktop browsers, the app is constrained to a **`max-width` of 480px**, centered, to preserve a mobile-app look.
- **No external database** required — all data lives in in-memory application state for the prototype.
- Deployed to **Vercel**, published from the `main` branch of the GitHub repository.

## 2. Design System

- **Dark theme** throughout the app.
- Primary accent color: **`#96FE17`** (green), used for primary buttons, active tab, highlights, and links.
- Background: near-black (`#0A0A0A`), surfaces in slightly lighter greys.
- Visual language inspired by the Strava mobile app: modern, clean, content-forward, with rounded cards and generous spacing.
- Typography: Geist Sans.
- Mobile-native touches: active-scale tap feedback, bottom-safe-area padding, no browser scrollbars, no tap highlight.

## 3. Global Behavior

- **Welcome** and **Onboarding** screens must **not scroll vertically** and must **not trigger pull-to-refresh** or rubber-band overscroll.
- Main app screens (Feed, Games, Players, Chats, and all sub-screens) may scroll vertically but must suppress pull-to-refresh.
- All state (profile, posts, comments, likes, games, chats, messages) is kept in a single React context and persists for the lifetime of the browser tab.

---

## 4. Welcome Screen (`/`)

- First screen shown when a user opens the app.
- Contains:
  - App **logo** (transparent PNG).
  - **Tagline** below the logo.
  - **Get Started** button near the bottom.
- Tapping **Get Started** moves the user to the onboarding flow.

## 5. Onboarding Flow (`/onboarding`)

- Five sequential screens; each contains an **icon**, **title**, **description**, and a **Next** button.
- The **Next** button sits near the bottom of the screen, in the same vertical position as **Get Started** on the Welcome screen.
- **Step indicator dots** appear above the Next button, showing progress; tapping a dot jumps directly to that step.
- **Swipe gestures** are supported on every onboarding screen:
  - Drag left → go to the next step.
  - Drag right → go to the previous step.
  - Live finger-follow with rubber-band resistance at the first and last steps.
  - Vertical drags are ignored (axis locking).
- No **Skip** button.
- After the final step, the user lands on the **Feed** tab.

**Onboarding screen content:**

| # | Title | Description |
|---|---|---|
| 1 | Find Courts Near You | Discover nearby pickleball courts and see where others are playing. |
| 2 | Schedule & Join Games | Create games or join open matches in your area. |
| 3 | Stay Connected with Players | Message players and coordinate games easily. |
| 4 | Share the Game | Post your games and see your friends playing on the social feed. |
| 5 | Let's Get You on the Court! | Create your profile. |

---

## 6. App Shell (main app)

The main app has a persistent layout:

- **Top-left corner**: **Menu** button, opens the slide-out menu.
- **Top-right corner**: **Add** button (plus icon) that creates new content for the active tab — a new post on Feed, a new game on Games, a new chat on Chats. The button is hidden on the Players tab; a spacer is rendered so the title stays centered.
- The visual style of the top app bar can be switched from the **Settings** screen (see §16). The choice is persisted in `localStorage` under `matchpoint:app-bar-variant`. Available variants:
  - **A — Classic** (default): stroke burger menu, centred page title, stroke plus icon (24 px).
  - **B — Big icons**: same layout as Classic, but the burger and plus icons are rendered at a larger size (30 px) and the centred title is a fixed "MatchPoint Pro" brand label (same on every tab).
  - **C — Framed**: burger and plus icons tucked inside rounded-square surface tiles for a tactile "button" feel; centred title between them.
  - **D — Branded**: stroke burger, centred **"Matchpoint" wordmark** (replaces the page title), stroke plus.
- **Bottom tab bar** with four tabs:
  1. **Feed**
  2. **Games**
  3. **Players**
  4. **Chats**
- Active tab is highlighted in the primary green color; inactive tabs are muted grey.
- The visual style of the bottom tab bar can be switched from the **Settings** screen (see §16). The choice is persisted in `localStorage` under `matchpoint:tab-bar-variant` so it survives reloads. Available variants:
  - **A — Floating dock**: rounded capsule detached from the bottom edge with a soft shadow.
  - **B — Sliding pill**: flush bar with a highlight pill that animates horizontally between tabs.
  - **C — Expanding pill (Material 3)**: inactive tabs show icon only; the active tab expands to reveal its label.
  - **D — Indicator line**: minimal — a short primary-coloured dash appears under the active tab.

## 7. Slide Menu

Uses an **underlay drawer** pattern (iOS-style side drawer): the menu and the main app shell sit on separate layers inside the 480px mobile frame. The menu is stationary, anchored to the left edge of the frame on a lower layer. The main shell sits on a higher layer and slides to the **right** by the menu's width (280px) to reveal the menu underneath.

Open / close behavior:

- Open: triggered by the top-left Menu button. Over ~400ms with a smooth easing curve, the main app shell translates 280px to the right (revealing the menu beneath) and picks up a soft shadow on its left edge. Its right portion is clipped by the phone frame, leaving a narrow peek of main content. The menu itself does not animate — it is already in place underneath.
- Close: tapping anywhere on the offset main content, or pressing **Escape**, slides the main shell back into place, hiding the menu again.
- There is no visible scrim and no explicit close button — the offset main content itself is the tap-to-close affordance.

Menu contents, from top to bottom:

1. **Profile card** at the top — its visual style is picked from Settings (see §16) and has four variants. In every variant the whole tile is a single tap target that opens the Edit Profile screen directly; there is never a separate edit button, and any pencil icon shown is purely decorative:
   - **A · Classic** (default) — filled `surface-light` card with a roomy profile row (avatar 52, name, email).
   - **B · Airy** — outlined card with a thin border and no filled background; same roomy profile row as Classic.
   - **C · Compact** — filled `surface-light` card with a compact profile row (avatar 44, smaller name/email) and a small decorative pencil icon on the right as an edit hint.
   - **D · Airy + hint** — outlined card (like B) with a roomy profile row plus a small decorative pencil icon on the right as an edit hint.
   The chosen variant is persisted in `localStorage` under `matchpoint:menu-profile-variant`.
2. **Settings** link — opens the Settings screen (see §16).
3. **Privacy Policy** link (opens a page).
4. **Terms of Use** link (opens a page).
5. **Log Out** button — returns the user to the Welcome screen.

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

At the bottom of the screen, below a separator, there is a subtle **Delete account** text link. It is intentionally low-contrast (muted grey, no background, no icon) — it only picks up a soft rose tint on press. Tapping it opens a confirmation dialog; on confirm the user is returned to the Welcome screen.

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
- **Upcoming** (default) — all games dated today or later.
- **Today** — games whose date falls on the current day.
- **Tomorrow** — games whose date falls on the next day.
- **Weekend** — games whose date falls on the upcoming Saturday and/or Sunday. If today is Saturday, both Saturday and Sunday are included; if today is Sunday, only Sunday is included; otherwise the next Sat–Sun are included.

Within every filter the games are sorted by **date ascending** (soonest first). Each filter shows a contextual empty state when no games match.

Each **game card** shows:
- Host: name, avatar.
- A small indicator for private games (lock icon).
- A pill showing spots remaining or "Full".
- Main info block organized for scannability:
  - **Date & time headline**: plain text (no icon) combining the date and time joined by a muted middle-dot. When the game falls on a nearby day the day portion collapses to a relative word (`Today`, `Tomorrow`, or `Yesterday` for just-past games) with the absolute date omitted — e.g. `Today · 9:00 AM`. For any other date the short absolute date is used instead — e.g. `Sat, Apr 18 · 9:00 AM`. Both the day and time share the prominent headline treatment; the separator stays muted.
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
- Header with the other user's name and avatar and a back button. The back button always returns to the **Chats** tab of the main app (`/feed?tab=chats`) regardless of how the user arrived — it does not fall back to arbitrary browser history.
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
  - The "today" anchor used for these labels is the latest of `REFERENCE_NOW` or the most recent message in the thread, so messages authored after `REFERENCE_NOW` (e.g. newly sent ones during a demo) still read as `Today` and earlier days shift to `Yesterday` / weekday labels automatically.
- Composer at the bottom with placeholder "Message {first name}…".
- Enter to send.

### 12.3 New chat (`/chat/new`)
Opened from the top-right **Add** button on the Chats tab. Shows:
- A search input for filtering players by name or email.
- A list of all other users.
- Selecting a player opens (or creates) a chat with them and jumps to it.

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

- **App theme** — a picker of seven named colour themes tuned for the product (sport/social): four dark (`Midnight Lime` — default; `Court Blue`; `Ember`; `Violet Rally`) and three light (`Daylight`; `Paper`; `Coral`). Each option is rendered as a swatch tile showing the theme's background, surface, and primary accent; the active theme gets a primary-coloured ring and check badge. Selecting a theme:
  - Instantly re-skins the entire app by swapping a set of CSS custom properties (`--app-bg`, `--app-fg`, `--app-primary`, `--app-surface`, `--app-border`, `--app-muted`, …) via `[data-theme="…"]` on `<html>`.
  - Persists the choice in `localStorage` under `matchpoint:theme` and is applied before hydration by a small inline script in the document head, so light-theme users don't get a dark-theme flash on reload.
  - Updates the mobile browser chrome colour (`<meta name="theme-color">`) to match.
- **App bar style** — a picker of four visual variants for the top app bar used across the Feed, Games, Players and Chats screens. Options are relabeled A–D top-to-bottom in the displayed order so the user-visible letter matches the position. The first option is selected by default. Each row is a card with an inline live preview of that variant rendered above its label and description:
  - **A · Big icons** (default) — larger (30 px) burger and plus icons with a fixed "MatchPoint Pro" brand title in the centre.
  - **B · Classic** — stroke burger, centred bold page title, stroke plus (24 px icons).
  - **C · Framed** — burger and plus icons wrapped in rounded-square surface tiles; centred title between them.
  - **D · Branded** — stroke burger, centred "Matchpoint" wordmark (replaces the title), stroke plus.

  The preview inside each card is purely decorative (static elements, not nested buttons) so the whole card acts as a single selection control. Selecting a variant:
  - Instantly re-skins the top bar everywhere it appears.
  - Persists the choice in `localStorage` under `matchpoint:app-bar-variant` so it survives reloads.
  - Marks the selected row with a filled primary-coloured check indicator; others show a neutral outlined circle.
- **Menu profile style** — a picker of four visual variants for the profile card at the top of the slide-out menu. Options are relabeled A–D top-to-bottom in the displayed order so the user-visible letter matches the position. The first option is selected by default. Each row renders a live, decorative preview of the card filled with the current user's name, email and initials. In every variant the whole tile is a single tap target that opens the Edit Profile screen directly; any pencil icon shown is purely decorative:
  - **A · Airy + hint** (default) — outlined card with a thin border, a roomy profile row, and a small decorative pencil icon on the right as an edit hint.
  - **B · Compact** — filled `surface-light` card with a compact profile row and a small decorative pencil icon on the right as an edit hint.
  - **C · Airy** — outlined card with a thin border and no filled background; roomy profile row.
  - **D · Classic** — filled `surface-light` card with a roomy profile row.

  Selecting a variant instantly re-skins the profile card in the slide-out menu and persists the choice in `localStorage` under `matchpoint:menu-profile-variant`.
- **Tab bar style** — radio-style list of the four visual variants available for the bottom tab bar (Floating dock, Sliding pill, Expanding pill, Indicator line). Selecting an option:
  - Instantly re-skins the bottom tab bar across the app.
  - Persists the choice in `localStorage` under `matchpoint:tab-bar-variant` so it survives reloads.
  - Marks the selected row with a filled primary-coloured check indicator; others show a neutral outlined circle.
- **Preview** — a demo tab bar rendered inline below the variant list, framed inside a rounded card with a subtle border. It uses the same four tabs (Feed, Games, Players, Chats) and adopts whichever variant is currently selected, so changes in the list re-skin the preview immediately. Tapping a tab in the preview only updates its local active state — it does **not** navigate anywhere, so users can explore the active/inactive transitions of each style without leaving the Settings screen.

The screen is a container for future account/app preferences; the app theme picker, app bar style picker, menu profile style picker, tab bar style section, and its preview ship today.
