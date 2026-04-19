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

function ts(offsetMs: number): Timestamp {
  return Timestamp.fromMillis(SEED_NOW + offsetMs);
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

const GAMES: SeedGame[] = [
  {
    id: "g_1",
    userId: "u_er",
    court: "Sunset Park",
    dateOffsetMs: DAY,
    minSkill: "Beginner",
    maxPlayers: 8,
    notes: "Casual morning session, all levels welcome.",
    isPrivate: false,
    playerIds: ["u_er", "u_tb", "u_rp"],
    createdOffsetMs: -5 * HOUR,
  },
  {
    id: "g_2",
    userId: "u_dk",
    court: "Lakeview Recreation Center",
    dateOffsetMs: 2 * DAY,
    minSkill: "Advanced",
    maxPlayers: 4,
    notes: "Competitive doubles. Bring your A-game.",
    isPrivate: false,
    playerIds: ["u_dk", "u_sc"],
    createdOffsetMs: -3 * HOUR,
  },
  {
    id: "g_3",
    userId: "u_mj",
    court: "Downtown Pickleball Center",
    dateOffsetMs: 3 * DAY,
    minSkill: "Intermediate",
    maxPlayers: 4,
    isPrivate: false,
    playerIds: ["u_mj", "u_jw"],
    createdOffsetMs: -DAY,
  },
  {
    id: "g_4",
    userId: "u_at",
    court: "Community Sports Complex",
    dateOffsetMs: 4 * DAY,
    minSkill: "Intermediate",
    maxPlayers: 4,
    notes: "Paddle demo afterwards!",
    isPrivate: false,
    playerIds: ["u_at", "u_mj", "u_jw", "u_rp"],
    createdOffsetMs: -2 * DAY,
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
