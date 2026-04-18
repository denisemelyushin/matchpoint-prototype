// Shared Admin SDK initialiser for scripts under /scripts.
// Reads the service-account key path from FIREBASE_SERVICE_ACCOUNT_PATH
// (set in .env.local). Intentionally isolated from src/ so the admin
// SDK is never bundled for the browser.

import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _app: App | undefined;

export function getAdminApp(): App {
  if (_app) return _app;
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!keyPath) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_PATH is not set. " +
        "Add it to .env.local pointing at the service-account JSON."
    );
  }
  const raw = readFileSync(keyPath, "utf8");
  const serviceAccount = JSON.parse(raw) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };
  _app = getApps()[0] ?? initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
    projectId: serviceAccount.project_id,
  });
  return _app;
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
