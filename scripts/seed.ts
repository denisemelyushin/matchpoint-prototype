// Seed the `match-point-pro-k6onnj` Firestore with a small set of demo
// users, posts, and games that match the shape documented in db-schema.md.
//
// Run via:   npm run db:seed
// Clear first: npm run db:seed -- --reset
//
// Uses the Admin SDK (service-account credentials), so all writes bypass
// security rules. NEVER call into this module from client code.

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "./firebase-admin";

// Anchor all seeded timestamps to the moment the seed script runs, so relative
// labels like "2 hr ago" / "Today" always read as fresh on the next client load.
const SEED_NOW = Date.now();
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Midnight *local time* of the day the seed runs. Used so game timestamps
// can be expressed as `dayAt(dayOffset, hourOfDay)` and always land on the
// intended calendar day, regardless of what hour the seed script is invoked.
const SEED_TODAY = new Date(SEED_NOW);
const START_OF_TODAY_MS = new Date(
  SEED_TODAY.getFullYear(),
  SEED_TODAY.getMonth(),
  SEED_TODAY.getDate()
).getTime();

function ts(offsetMs: number): Timestamp {
  return Timestamp.fromMillis(SEED_NOW + offsetMs);
}

/** Offset (from SEED_NOW) that lands on `dayOffset` days from today at the
 *  given wall-clock hour in local time. */
function dayAt(dayOffset: number, hour: number): number {
  return START_OF_TODAY_MS + dayOffset * DAY + hour * HOUR - SEED_NOW;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase().slice(0, 2);
}

/* -------------------------------------------------------------------------- */
/*  Seed data                                                                  */
/* -------------------------------------------------------------------------- */

interface SeedUser {
  id: string;
  name: string;
  email: string;
  bio: string;
  skillLevel: "Beginner" | "Intermediate" | "Advanced" | "Pro";
  friendIds: string[];
}

const USERS: SeedUser[] = [
  {
    id: "u_sc",
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    bio: "Doubles specialist. Love a good dink battle.",
    skillLevel: "Advanced",
    friendIds: ["u_mj", "u_er"],
  },
  {
    id: "u_mj",
    name: "Marcus Johnson",
    email: "marcus.j@example.com",
    bio: "Started playing 2 years ago. Obsessed ever since.",
    skillLevel: "Intermediate",
    friendIds: ["u_sc", "u_jw"],
  },
  {
    id: "u_er",
    name: "Emily Rodriguez",
    email: "emily.r@example.com",
    bio: "Morning player. 6 AM crew regular.",
    skillLevel: "Advanced",
    friendIds: ["u_sc", "u_tb"],
  },
  {
    id: "u_dk",
    name: "David Kim",
    email: "david.kim@example.com",
    bio: "Tournament director & 4.5 player. DM for partner requests.",
    skillLevel: "Pro",
    friendIds: [],
  },
  {
    id: "u_jw",
    name: "Jessica Williams",
    email: "jess.w@example.com",
    bio: "Just broke into 4.0! Working on my third shot drops.",
    skillLevel: "Advanced",
    friendIds: ["u_mj"],
  },
  {
    id: "u_at",
    name: "Alex Thompson",
    email: "alex.t@example.com",
    bio: "Paddle collector. Always happy to let you try one.",
    skillLevel: "Intermediate",
    friendIds: [],
  },
  {
    id: "u_rp",
    name: "Rachel Park",
    email: "rachel.park@example.com",
    bio: "Ex-tennis player transitioning to pickleball. Learning fast.",
    skillLevel: "Intermediate",
    friendIds: [],
  },
  {
    id: "u_tb",
    name: "Tom Bradford",
    email: "tom.b@example.com",
    bio: "Weekend warrior. Open to matches any skill level.",
    skillLevel: "Beginner",
    friendIds: ["u_er"],
  },
];

interface SeedComment {
  id: string;
  userId: string;
  content: string;
  offsetMs: number;
}

interface SeedPost {
  id: string;
  userId: string;
  content: string;
  location?: string;
  imageUrl?: string;
  isPrivate: boolean;
  likeUserIds: string[];
  comments: SeedComment[];
  offsetMs: number;
}

const POSTS: SeedPost[] = [
  {
    id: "p_1",
    userId: "u_sc",
    content:
      "Great doubles match today at Riverside Courts! Won 11-7, 11-9. My partner was on fire with those dinks!",
    location: "Riverside Courts",
    isPrivate: false,
    likeUserIds: ["u_mj", "u_er", "u_dk", "u_jw"],
    comments: [
      {
        id: "c_1",
        userId: "u_mj",
        content: "Nice work! Who was your partner?",
        offsetMs: -10 * MINUTE,
      },
      {
        id: "c_2",
        userId: "u_sc",
        content: "Jess! She was unstoppable today.",
        offsetMs: -8 * MINUTE,
      },
    ],
    offsetMs: -15 * MINUTE,
  },
  {
    id: "p_2",
    userId: "u_mj",
    content:
      "Just hit my first Erne in a competitive game! All those practice sessions finally paying off. Thanks to everyone who gave me tips!",
    location: "Downtown Pickleball Center",
    isPrivate: false,
    likeUserIds: ["u_sc", "u_dk", "u_jw", "u_er"],
    comments: [
      {
        id: "c_3",
        userId: "u_dk",
        content: "Huge! Next step: backhand Erne.",
        offsetMs: -50 * MINUTE,
      },
    ],
    offsetMs: -HOUR,
  },
  {
    id: "p_3",
    userId: "u_er",
    content:
      "Beautiful morning for pickleball! 6 AM crew never disappoints. Who's joining tomorrow?",
    location: "Sunset Park",
    isPrivate: false,
    likeUserIds: ["u_sc", "u_tb"],
    comments: [],
    offsetMs: -2 * HOUR,
  },
  {
    id: "p_4",
    userId: "u_dk",
    content:
      "Tournament this weekend at Lakeview! Still need 2 more teams for mixed doubles. DM me if interested. Registration closes Friday!",
    location: "Lakeview Recreation Center",
    isPrivate: false,
    likeUserIds: ["u_sc", "u_rp", "u_mj", "u_jw", "u_at"],
    comments: [
      {
        id: "c_4",
        userId: "u_rp",
        content: "Count me in! I'll message you.",
        offsetMs: -2 * HOUR,
      },
    ],
    offsetMs: -3 * HOUR,
  },
  {
    id: "p_5",
    userId: "u_jw",
    content:
      "Finally broke through to 4.0 rating! It's been a long journey from beginner to here. Never stop improving!",
    isPrivate: false,
    likeUserIds: ["u_sc", "u_mj", "u_er", "u_dk", "u_at"],
    comments: [],
    offsetMs: -5 * HOUR,
  },
  {
    id: "p_6",
    userId: "u_at",
    content:
      "New paddle day! Testing out the Joola Hyperion CFS 16. First impressions — the control is insane. Full review coming soon.",
    isPrivate: false,
    likeUserIds: ["u_mj"],
    comments: [],
    offsetMs: -6 * HOUR,
  },
  {
    id: "p_7",
    userId: "u_rp",
    content:
      "Drills session with the team was amazing today. Worked on third shot drops for an hour straight. Feeling more confident than ever!",
    location: "Community Sports Complex",
    isPrivate: false,
    likeUserIds: ["u_er", "u_dk"],
    comments: [],
    offsetMs: -8 * HOUR,
  },
];

interface SeedGame {
  id: string;
  userId: string;
  court: string;
  dateOffsetMs: number;
  minSkill: "Beginner" | "Intermediate" | "Advanced" | "Pro";
  maxPlayers: number;
  notes?: string;
  isPrivate: boolean;
  playerIds: string[];
  createdOffsetMs: number;
}

// A handful of games spread across the next 7 calendar days at realistic
// wall-clock times. Multiple games per day give the Games tab enough to
// show interesting filtering (Today / Tomorrow / This weekend / Upcoming)
// without looking empty.
const GAMES: SeedGame[] = [
  // +1 day
  {
    id: "g_1a",
    userId: "u_er",
    court: "Sunset Park",
    dateOffsetMs: dayAt(1, 9),
    minSkill: "Beginner",
    maxPlayers: 8,
    notes: "Casual morning session, all levels welcome.",
    isPrivate: false,
    playerIds: ["u_er", "u_tb", "u_rp"],
    createdOffsetMs: -5 * HOUR,
  },
  {
    id: "g_1b",
    userId: "u_mj",
    court: "Riverside Courts",
    dateOffsetMs: dayAt(1, 18),
    minSkill: "Intermediate",
    maxPlayers: 4,
    notes: "After-work doubles. Lights on until 9.",
    isPrivate: false,
    playerIds: ["u_mj", "u_jw"],
    createdOffsetMs: -4 * HOUR,
  },
  // +2 days
  {
    id: "g_2a",
    userId: "u_tb",
    court: "Sunset Park",
    dateOffsetMs: dayAt(2, 7),
    minSkill: "Beginner",
    maxPlayers: 4,
    notes: "6 AM crew — bring coffee.",
    isPrivate: false,
    playerIds: ["u_tb", "u_rp"],
    createdOffsetMs: -7 * HOUR,
  },
  {
    id: "g_2b",
    userId: "u_jw",
    court: "Downtown Pickleball Center",
    dateOffsetMs: dayAt(2, 13),
    minSkill: "Intermediate",
    maxPlayers: 4,
    isPrivate: false,
    playerIds: ["u_jw"],
    createdOffsetMs: -6 * HOUR,
  },
  {
    id: "g_2c",
    userId: "u_dk",
    court: "Lakeview Recreation Center",
    dateOffsetMs: dayAt(2, 17),
    minSkill: "Advanced",
    maxPlayers: 4,
    notes: "Competitive doubles. Bring your A-game.",
    isPrivate: false,
    playerIds: ["u_dk", "u_sc"],
    createdOffsetMs: -3 * HOUR,
  },
  // +3 days
  {
    id: "g_3a",
    userId: "u_mj",
    court: "Downtown Pickleball Center",
    dateOffsetMs: dayAt(3, 18),
    minSkill: "Intermediate",
    maxPlayers: 4,
    isPrivate: false,
    playerIds: ["u_mj", "u_jw"],
    createdOffsetMs: -DAY,
  },
  {
    id: "g_3b",
    userId: "u_sc",
    court: "Community Sports Complex",
    dateOffsetMs: dayAt(3, 20),
    minSkill: "Pro",
    maxPlayers: 4,
    notes: "4.5+ drill night.",
    isPrivate: false,
    playerIds: ["u_sc", "u_dk"],
    createdOffsetMs: -DAY - 2 * HOUR,
  },
  // +4 days
  {
    id: "g_4a",
    userId: "u_er",
    court: "Lakeview Recreation Center",
    dateOffsetMs: dayAt(4, 10),
    minSkill: "Advanced",
    maxPlayers: 4,
    isPrivate: false,
    playerIds: ["u_er", "u_sc"],
    createdOffsetMs: -DAY - 4 * HOUR,
  },
  {
    id: "g_4b",
    userId: "u_at",
    court: "Community Sports Complex",
    dateOffsetMs: dayAt(4, 19),
    minSkill: "Intermediate",
    maxPlayers: 4,
    notes: "Paddle demo afterwards!",
    isPrivate: false,
    playerIds: ["u_at", "u_mj", "u_jw", "u_rp"],
    createdOffsetMs: -2 * DAY,
  },
  // +5 days
  {
    id: "g_5a",
    userId: "u_rp",
    court: "Riverside Courts",
    dateOffsetMs: dayAt(5, 9),
    minSkill: "Intermediate",
    maxPlayers: 4,
    notes: "Weekend social. Round robin.",
    isPrivate: false,
    playerIds: ["u_rp", "u_mj"],
    createdOffsetMs: -2 * DAY,
  },
  {
    id: "g_5b",
    userId: "u_tb",
    court: "Sunset Park",
    dateOffsetMs: dayAt(5, 15),
    minSkill: "Beginner",
    maxPlayers: 8,
    notes: "Afternoon open play.",
    isPrivate: false,
    playerIds: ["u_tb", "u_er"],
    createdOffsetMs: -2 * DAY - 3 * HOUR,
  },
  // +6 days
  {
    id: "g_6a",
    userId: "u_sc",
    court: "Lakeview Recreation Center",
    dateOffsetMs: dayAt(6, 8),
    minSkill: "Advanced",
    maxPlayers: 4,
    notes: "Weekend sweat session.",
    isPrivate: false,
    playerIds: ["u_sc", "u_jw", "u_dk"],
    createdOffsetMs: -3 * DAY,
  },
  {
    id: "g_6b",
    userId: "u_at",
    court: "Community Sports Complex",
    dateOffsetMs: dayAt(6, 16),
    minSkill: "Intermediate",
    maxPlayers: 4,
    isPrivate: false,
    playerIds: ["u_at", "u_rp"],
    createdOffsetMs: -3 * DAY - 2 * HOUR,
  },
  // +7 days
  {
    id: "g_7a",
    userId: "u_er",
    court: "Riverside Courts",
    dateOffsetMs: dayAt(7, 7),
    minSkill: "Beginner",
    maxPlayers: 8,
    notes: "Early birds welcome.",
    isPrivate: false,
    playerIds: ["u_er", "u_tb"],
    createdOffsetMs: -4 * DAY,
  },
  {
    id: "g_7b",
    userId: "u_dk",
    court: "Downtown Pickleball Center",
    dateOffsetMs: dayAt(7, 19),
    minSkill: "Pro",
    maxPlayers: 4,
    notes: "Hot-sauce night — drills + games.",
    isPrivate: false,
    playerIds: ["u_dk"],
    createdOffsetMs: -4 * DAY - 2 * HOUR,
  },
];

/* -------------------------------------------------------------------------- */
/*  Seeder                                                                     */
/* -------------------------------------------------------------------------- */

async function clearCollection(
  db: FirebaseFirestore.Firestore,
  path: string
): Promise<void> {
  const snap = await db.collection(path).get();
  if (snap.empty) return;
  // Batch deletes in groups of 400 (Firestore limit is 500 ops per batch).
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    for (const doc of docs.slice(i, i + 400)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
}

async function clearPostSubcollections(
  db: FirebaseFirestore.Firestore
): Promise<void> {
  const posts = await db.collection("posts").get();
  for (const post of posts.docs) {
    await clearCollection(db, `posts/${post.id}/comments`);
    await clearCollection(db, `posts/${post.id}/likes`);
  }
}

async function reset(db: FirebaseFirestore.Firestore): Promise<void> {
  console.log("  - clearing posts/* subcollections…");
  await clearPostSubcollections(db);
  console.log("  - clearing top-level collections…");
  await clearCollection(db, "posts");
  await clearCollection(db, "games");
  await clearCollection(db, "users");
}

async function seedUsers(db: FirebaseFirestore.Firestore): Promise<void> {
  const batch = db.batch();
  for (const u of USERS) {
    const ref = db.collection("users").doc(u.id);
    batch.set(ref, {
      name: u.name,
      email: u.email,
      bio: u.bio,
      skillLevel: u.skillLevel,
      initials: initialsFromName(u.name),
      friendIds: u.friendIds,
      createdAt: ts(-30 * DAY),
      updatedAt: ts(-30 * DAY),
    });
  }
  await batch.commit();
  console.log(`  - ${USERS.length} users written`);
}

async function seedPosts(db: FirebaseFirestore.Firestore): Promise<void> {
  for (const p of POSTS) {
    const postRef = db.collection("posts").doc(p.id);
    const postData: Record<string, unknown> = {
      userId: p.userId,
      content: p.content,
      isPrivate: p.isPrivate,
      likeCount: p.likeUserIds.length,
      commentCount: p.comments.length,
      createdAt: ts(p.offsetMs),
    };
    if (p.location) postData.location = p.location;
    if (p.imageUrl) postData.imageUrl = p.imageUrl;
    await postRef.set(postData);

    if (p.likeUserIds.length > 0) {
      const likeBatch = db.batch();
      for (const uid of p.likeUserIds) {
        likeBatch.set(postRef.collection("likes").doc(uid), {
          userId: uid,
          createdAt: ts(p.offsetMs),
        });
      }
      await likeBatch.commit();
    }

    if (p.comments.length > 0) {
      const commentBatch = db.batch();
      for (const c of p.comments) {
        commentBatch.set(postRef.collection("comments").doc(c.id), {
          userId: c.userId,
          content: c.content,
          createdAt: ts(c.offsetMs),
        });
      }
      await commentBatch.commit();
    }
  }
  console.log(`  - ${POSTS.length} posts written (with comments + likes)`);
}

async function seedGames(db: FirebaseFirestore.Firestore): Promise<void> {
  const batch = db.batch();
  for (const g of GAMES) {
    const ref = db.collection("games").doc(g.id);
    const data: Record<string, unknown> = {
      userId: g.userId,
      court: g.court,
      date: ts(g.dateOffsetMs),
      minSkill: g.minSkill,
      maxPlayers: g.maxPlayers,
      isPrivate: g.isPrivate,
      playerIds: g.playerIds,
      playerCount: g.playerIds.length,
      createdAt: ts(g.createdOffsetMs),
    };
    if (g.notes) data.notes = g.notes;
    batch.set(ref, data);
  }
  await batch.commit();
  console.log(`  - ${GAMES.length} games written`);
}

async function main() {
  const shouldReset = process.argv.includes("--reset");
  const db = getAdminDb();

  console.log(
    `Seeding project ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "(unknown)"}…`
  );

  if (shouldReset) {
    console.log("--reset passed — clearing collections first");
    await reset(db);
  }

  console.log("Writing users…");
  await seedUsers(db);
  console.log("Writing posts…");
  await seedPosts(db);
  console.log("Writing games…");
  await seedGames(db);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
