"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "./firebase";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase().slice(0, 2) || "?";
}

async function ensureUserDoc(
  uid: string,
  name: string,
  email: string
): Promise<void> {
  const ref = doc(getFirebaseDb(), "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    name,
    email,
    bio: "",
    skillLevel: "Intermediate",
    initials: initialsFromName(name),
    friendIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

interface AuthState {
  firebaseUser: FirebaseUser | null;
  currentUserId: string | null;
  isAuthenticating: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Resolves with the signed-in uid. If the user is currently a guest, opens
  // the auth modal and only resolves once they successfully sign in / sign up.
  // Rejects with Error("auth-cancelled") if the user dismisses the modal.
  requireAuth: () => Promise<string>;
  // Modal state (consumed by the AuthModal rendered at the app root).
  modalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: (options?: { cancelled?: boolean }) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const pendingRef = useRef<{
    resolve: (uid: string) => void;
    reject: (e: unknown) => void;
  } | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setIsAuthenticating(false);
      // If a requireAuth() call was waiting, resolve it now.
      if (u && pendingRef.current) {
        pendingRef.current.resolve(u.uid);
        pendingRef.current = null;
        setModalOpen(false);
      }
    });
    return unsub;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      const cred = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email,
        password
      );
      await fbUpdateProfile(cred.user, { displayName: name });
      await ensureUserDoc(cred.user.uid, name, email);
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      email,
      password
    );
    // Defensive: if the Auth user exists but the Firestore doc doesn't yet
    // (e.g. signed up on another platform without the doc write), create it.
    await ensureUserDoc(
      cred.user.uid,
      cred.user.displayName ?? (email.split("@")[0] || "Player"),
      email
    );
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(getFirebaseAuth());
  }, []);

  const openAuthModal = useCallback(() => setModalOpen(true), []);

  const closeAuthModal = useCallback(
    (options?: { cancelled?: boolean }) => {
      setModalOpen(false);
      if (options?.cancelled && pendingRef.current) {
        pendingRef.current.reject(new Error("auth-cancelled"));
        pendingRef.current = null;
      }
    },
    []
  );

  const requireAuth = useCallback((): Promise<string> => {
    const uid = firebaseUser?.uid;
    if (uid) return Promise.resolve(uid);
    return new Promise<string>((resolve, reject) => {
      pendingRef.current = { resolve, reject };
      setModalOpen(true);
    });
  }, [firebaseUser]);

  const value = useMemo<AuthState>(
    () => ({
      firebaseUser,
      currentUserId: firebaseUser?.uid ?? null,
      isAuthenticating,
      signUp,
      signIn,
      signOut,
      requireAuth,
      modalOpen,
      openAuthModal,
      closeAuthModal,
    }),
    [
      firebaseUser,
      isAuthenticating,
      signUp,
      signIn,
      signOut,
      requireAuth,
      modalOpen,
      openAuthModal,
      closeAuthModal,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be called inside <AuthProvider>");
  }
  return ctx;
}

/**
 * Used by pages that inherently require an account (create post, create game,
 * profile edit, chat, etc.). On mount, if the user is a guest, opens the auth
 * modal. If they dismiss it, the caller navigates back.
 *
 * Returns `{ isReady }`:
 *   - `false` while auth is still loading, or while the modal is open but
 *     the user hasn't signed in yet.
 *   - `true` once `currentUserId` is set. Only render page content when true.
 */
export function useRequireAuthPage(onCancelled?: () => void): {
  isReady: boolean;
} {
  const { currentUserId, isAuthenticating, requireAuth } = useAuth();
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (isAuthenticating) return;
    if (currentUserId) {
      triggeredRef.current = false;
      return;
    }
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    requireAuth().catch(() => {
      onCancelled?.();
    });
  }, [currentUserId, isAuthenticating, requireAuth, onCancelled]);

  return { isReady: !!currentUserId };
}
