import { collection, doc, documentId, onSnapshot, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EVENT_ID } from "../../../shared/constants";
import { challenges } from "../../../shared/challenges/catalog";
import type { Challenge, ChallengeAssignment, ChallengeProgress } from "../../../shared/challenges/types";
import { db } from "../../firebase/data";
import { functions } from "../../firebase/functions";
import { useAuth } from "../auth/AuthProvider";
import { orderChallengesForUser } from "./challenge-view";

export type AssignedChallenge = { challenge: Challenge; progress: ChallengeProgress };

const currentC18 = challenges.find((challenge) => challenge.id === "C18")!;

function withCurrentCopy(challenge: Challenge): Challenge {
  const currentCopy = challenges.find((entry) => entry.id === challenge.id);
  if (!currentCopy) return challenge;
  if (challenge.id === "C08") return { ...challenge, title: currentCopy.title, description: currentCopy.description };
  if (challenge.id === "C18") return {
    ...challenge,
    title: currentC18.title,
    description: currentC18.description,
    configuration: { ...challenge.configuration, scenario: currentC18.configuration.scenario }
  };
  return { ...challenge, description: currentCopy.description };
}

function useChallengeDataSource() {
  const { user } = useAuth();
  const userId = user?.uid;
  const [assignment, setAssignment] = useState<ChallengeAssignment | null>(null);
  const [catalog, setCatalog] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<ChallengeProgress[]>([]);
  const [auraTotal, setAuraTotal] = useState<number | null>(null);
  const [auraDeductedTotal, setAuraDeductedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    setAssignment(null);
    setCatalog([]);
    setProgress([]);
    setAuraTotal(null);
    setAuraDeductedTotal(0);
    setError("");
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    let active = true;
    let stopCatalog = () => {}; let stopProgress = () => {}; let stopScore = () => {}; let stopAssignment = () => {};
    void httpsCallable(functions, "ensureChallengeAssignment")({}).then(() => {
      if (!active) return;
      stopScore = onSnapshot(doc(db, "scores", `${EVENT_ID}_${userId}`), (snapshot) => {
        setAuraTotal(snapshot.exists() ? (snapshot.data().auraTotal ?? 0) : 0);
        setAuraDeductedTotal(snapshot.exists() ? (snapshot.data().auraDeductedTotal ?? 0) : 0);
      }, () => setError("No pudimos cargar tus créditos."));
      stopAssignment = onSnapshot(doc(db, "challengeAssignments", userId), (snapshot) => {
        if (!snapshot.exists()) return;
        const next = snapshot.data() as ChallengeAssignment;
        if (next.challengeIds.some((id) => ["C03", "C05", "C10", "C11", "C13", "C14"].includes(id)) || ["C08", "C12", "C15"].some((id) => !next.challengeIds.includes(id))) return;
        stopCatalog(); stopProgress();
        setAssignment(next);
        let catalogReady = false, progressReady = false;
        const allIds = [...new Set([...next.challengeIds, ...(next.bonusChallengeIds ?? [])])];
        stopCatalog = onSnapshot(query(collection(db, "challenges"), where(documentId(), "in", allIds)), (items) => { setCatalog(items.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Challenge)); catalogReady = true; if (progressReady) setLoading(false); }, () => { setError("No pudimos cargar el catálogo."); setLoading(false); });
        stopProgress = onSnapshot(query(collection(db, "challengeProgress"), where("userId", "==", userId)), (items) => { setProgress(items.docs.map((entry) => entry.data() as ChallengeProgress).filter((entry) => entry.eventId === EVENT_ID)); progressReady = true; if (catalogReady) setLoading(false); }, () => { setError("No pudimos cargar tu progreso."); setLoading(false); });
      }, () => { setError("No pudimos cargar tu asignación."); setLoading(false); });
    }).catch(() => { if (active) { setError("No pudimos preparar tus Challenges. Recarga la página."); setLoading(false); } });
    return () => { active = false; stopAssignment(); stopCatalog(); stopProgress(); stopScore(); };
  }, [userId]);
  const byChallenge = new Map(catalog.map((challenge) => [challenge.id, challenge]));
  const byProgress = new Map(progress.map((item) => [item.challengeId, item]));
  const allIds = [...(assignment?.challengeIds ?? []), ...(assignment?.bonusChallengeIds ?? [])].filter((id) => !["C03", "C05", "C10", "C11", "C13", "C14"].includes(id));
  const items = orderChallengesForUser(allIds.flatMap((id) => {
    const challenge = byChallenge.get(id), state = byProgress.get(id);
    return challenge && state ? [{ challenge: withCurrentCopy(challenge), progress: state }] : [];
  }), userId ?? "");
  return useMemo(() => ({ items, auraTotal, auraDeductedTotal, loading, error }), [items, auraTotal, auraDeductedTotal, loading, error]);
}

type ChallengeData = ReturnType<typeof useChallengeDataSource>;
const ChallengeDataContext = createContext<ChallengeData | null>(null);

export function ChallengeDataProvider({ children }: { children: ReactNode }) {
  const value = useChallengeDataSource();
  return createElement(ChallengeDataContext.Provider, { value }, children);
}

export function useChallenges() {
  const value = useContext(ChallengeDataContext);
  if (!value) throw new Error("useChallenges must be used inside ChallengeDataProvider");
  return value;
}
