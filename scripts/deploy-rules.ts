// Deploys firestore.rules and firestore.indexes.json to the Firebase project
// using the Admin SDK service-account credentials (no `firebase login` needed).
//
// Run with:  npm run db:deploy-rules
//
// The service-account key path is loaded from .env.local
// (FIREBASE_SERVICE_ACCOUNT_PATH).

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { readFileSync } from "node:fs";
import { getAdminApp } from "./firebase-admin";

async function getAccessToken(): Promise<string> {
  // Use firebase-admin's credential to mint an access token.
  const app = getAdminApp();
  // @ts-expect-error — credential is present on the internal options.
  const credential = app.options.credential;
  if (!credential) throw new Error("no credential on admin app");
  const token = await credential.getAccessToken();
  return token.access_token;
}

function getProjectId(): string {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!keyPath) throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH not set");
  const sa = JSON.parse(readFileSync(keyPath, "utf8")) as { project_id: string };
  return sa.project_id;
}

async function deployRules(projectId: string, accessToken: string) {
  const rulesText = readFileSync("firestore.rules", "utf8");

  // 1) Create a ruleset.
  const createRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: {
          files: [
            {
              name: "firestore.rules",
              content: rulesText,
            },
          ],
        },
      }),
    }
  );
  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(`Create ruleset failed: ${createRes.status} ${body}`);
  }
  const ruleset = (await createRes.json()) as { name: string };
  console.log(`Created ruleset: ${ruleset.name}`);

  // 2) Update the release to point at this ruleset.
  const releasePath = `projects/${projectId}/releases/cloud.firestore`;
  const patchRes = await fetch(
    `https://firebaserules.googleapis.com/v1/${releasePath}?updateMask=rulesetName`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        release: {
          name: releasePath,
          rulesetName: ruleset.name,
        },
      }),
    }
  );
  if (!patchRes.ok) {
    // If the release doesn't exist yet, create it.
    if (patchRes.status === 404) {
      const createRel = await fetch(
        `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: releasePath,
            rulesetName: ruleset.name,
          }),
        }
      );
      if (!createRel.ok) {
        const body = await createRel.text();
        throw new Error(`Create release failed: ${createRel.status} ${body}`);
      }
      console.log(`Created release ${releasePath}`);
    } else {
      const body = await patchRes.text();
      throw new Error(`Update release failed: ${patchRes.status} ${body}`);
    }
  } else {
    console.log(`Updated release ${releasePath}`);
  }
}

interface IndexSpec {
  collectionGroup: string;
  queryScope: "COLLECTION" | "COLLECTION_GROUP";
  fields: Array<{
    fieldPath: string;
    order?: "ASCENDING" | "DESCENDING";
    arrayConfig?: "CONTAINS";
  }>;
}

interface IndexesFile {
  indexes: IndexSpec[];
  fieldOverrides?: Array<{
    collectionGroup: string;
    fieldPath: string;
    indexes: Array<{
      order?: "ASCENDING" | "DESCENDING";
      arrayConfig?: "CONTAINS";
      queryScope: "COLLECTION" | "COLLECTION_GROUP";
    }>;
  }>;
}

async function deployIndexes(projectId: string, accessToken: string) {
  const raw = JSON.parse(readFileSync("firestore.indexes.json", "utf8")) as IndexesFile;
  const db = "(default)";

  for (const idx of raw.indexes) {
    const url =
      `https://firestore.googleapis.com/v1/projects/${projectId}` +
      `/databases/${db}/collectionGroups/${idx.collectionGroup}/indexes`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queryScope: idx.queryScope,
        fields: idx.fields,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      if (res.status === 409 || body.includes("already exists")) {
        console.log(`Index on ${idx.collectionGroup} already exists, skipping`);
      } else {
        console.error(`Index create failed for ${idx.collectionGroup}: ${res.status} ${body}`);
      }
    } else {
      console.log(`Created index on ${idx.collectionGroup}`);
    }
  }

  for (const fo of raw.fieldOverrides ?? []) {
    const url =
      `https://firestore.googleapis.com/v1/projects/${projectId}` +
      `/databases/${db}/collectionGroups/${fo.collectionGroup}/fields/${fo.fieldPath}?updateMask=indexConfig`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        indexConfig: {
          indexes: fo.indexes.map((i) => ({
            queryScope: i.queryScope,
            fields: [
              {
                fieldPath: fo.fieldPath,
                order: i.order,
                arrayConfig: i.arrayConfig,
              },
            ],
          })),
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Field override failed for ${fo.collectionGroup}.${fo.fieldPath}: ${res.status} ${body}`);
    } else {
      console.log(`Applied field override ${fo.collectionGroup}.${fo.fieldPath}`);
    }
  }
}

async function main() {
  const projectId = getProjectId();
  const token = await getAccessToken();
  console.log(`Deploying to project: ${projectId}`);

  await deployRules(projectId, token);
  await deployIndexes(projectId, token);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
