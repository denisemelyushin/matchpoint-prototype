// Quick sanity read. `npm run db:inspect`
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { getAdminDb } from "./firebase-admin";

async function main() {
  const db = getAdminDb();
  const [users, posts, games] = await Promise.all([
    db.collection("users").get(),
    db.collection("posts").get(),
    db.collection("games").get(),
  ]);
  console.log(`users: ${users.size}`);
  users.docs.slice(0, 3).forEach((d) => {
    const data = d.data();
    console.log(`  ${d.id} — ${data.name} (${data.skillLevel})`);
  });
  console.log(`posts: ${posts.size}`);
  for (const p of posts.docs.slice(0, 3)) {
    const likes = await p.ref.collection("likes").get();
    const comments = await p.ref.collection("comments").get();
    const d = p.data();
    console.log(
      `  ${p.id} — ${d.userId} · likes:${likes.size} · comments:${comments.size}`
    );
  }
  console.log(`games: ${games.size}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
