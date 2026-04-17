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
- **Top-right corner**: **Add** button (plus icon) that creates new content for the active tab — a new post on Feed, a new game on Games, a new chat on Chats. The button is hidden on the Players tab (users list is read-only); a spacer is rendered so the title stays centered.
- **Bottom tab bar** with four tabs:
  1. **Feed**
  2. **Games**
  3. **Players**
  4. **Chats**
- Active tab is highlighted in the primary green color; inactive tabs are muted grey.

## 7. Slide Menu

Opens from the left. Contains, from top to bottom:

1. **Profile bar** at the top showing:
   - User avatar
   - Name
   - Email
   - Tapping the profile bar opens the Profile screen.
2. **Edit Profile** button (primary-accented) linking to the edit profile screen.
3. **Privacy Policy** link (opens a page).
4. **Terms of Use** link (opens a page).
5. **Log Out** button — returns the user to the Welcome screen.
6. **Delete Account** button — destructive styling; confirms before returning to Welcome.

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

Private posts (visible only to the author) show a small lock icon next to the name.

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
Shows all public games (and the current user's private games). Each **game card** shows:
- Host: name, avatar.
- A small indicator for private games (lock icon).
- A pill showing spots remaining or "Full".
- Main info block (all in the same section, one per line):
  - **Court** (e.g. "Riverside Courts").
  - **Date and time** formatted in a human-friendly way.
  - **Minimum skill level**.
  - **Max players** and current number of players joined.
  - **Notes** (optional).

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

- Lists all users other than the current user.
- Each player card shows:
  - Avatar
  - Name
  - Skill level badge
  - Bio (truncated)
  - A **message** shortcut button (primary color) that opens — or creates — a chat with that player.

## 12. Chats (fourth tab)

### 12.1 Conversation list
Shows all existing conversations for the current user, sorted by most recent message. Each row shows:
- Other participant's avatar and name.
- Preview of the last message (prefixed with "You: " if sent by current user).
- Relative time of the last message.

### 12.2 Chat detail (`/chat/[id]`)
Full conversation view:
- Header with the other user's name and avatar and a back button.
- Scrollable message list, auto-scrolling to the latest message.
- Message bubbles styled differently for mine (right, primary color) and theirs (left, surface color).
- Composer at the bottom with placeholder "Message {first name}…".
- Enter to send.

### 12.3 New chat (`/chat/new`)
Opened from the top-right **Add** button on the Chats tab. Shows:
- A search input for filtering players by name or email.
- A list of all other users.
- Selecting a player opens (or creates) a chat with them and jumps to it.

---

## 13. Privacy & Visibility

- **Posts** can be marked Public or Private. Private posts are visible only to their author.
- **Games** can be marked Public or Private. Private games are visible only to their host.
- Private items display a small lock icon in their card.

---

## 14. Static Pages

- **Privacy Policy** (`/privacy`) — placeholder copy.
- **Terms of Use** (`/terms`) — placeholder copy.

---

## 15. Non-functional Requirements

- Must load instantly on mobile browsers (static where possible; Next.js App Router with RSC).
- Must feel native: tap feedback, smooth transitions (e.g. 300ms ease-out on step change, slide menu, etc.).
- No console errors or linter warnings on build.
- Images rendered fluidly without layout shift.
- Responsive to orientation and small-viewport heights.
