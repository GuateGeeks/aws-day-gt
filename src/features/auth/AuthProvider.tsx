import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot, type DocumentData } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserProfile } from "../../../shared/types";
import { auth } from "../../firebase/auth";
import { db } from "../../firebase/data";

type AuthState = { user: User | null; profile: UserProfile | null; loading: boolean };
const AuthContext = createContext<AuthState>({ user: null, profile: null, loading: true });

function profileFrom(data: DocumentData): UserProfile { return data as UserProfile; }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => onAuthStateChanged(auth, (next) => {
    setUser(next);
    setProfile(null);
    if (!next) { setLoading(false); return; }
    setLoading(true);
    return onSnapshot(doc(db, "users", next.uid), (snapshot) => {
      setProfile(snapshot.exists() ? profileFrom(snapshot.data()) : null);
      setLoading(false);
    }, () => setLoading(false));
  }), []);
  const value = useMemo(() => ({ user, profile, loading }), [user, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
