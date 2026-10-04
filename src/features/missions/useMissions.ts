import { collection, documentId, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Mission, UserMission } from "../../../shared/types";
import { db } from "../../firebase/data";
import { useAuth } from "../auth/AuthProvider";

export type AssignedMission = UserMission & { mission: Mission };
export function useMissions() {
  const { user } = useAuth(); const [items, setItems] = useState<AssignedMission[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) { setItems([]); setLoading(false); return; }
    const assignmentsQuery = query(collection(db, "userMissions"), where("userId", "==", user.uid));
    return onSnapshot(assignmentsQuery, async (snapshot) => {
      const assignments = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as UserMission);
      const ids = assignments.map((item) => item.missionId);
      if (!ids.length) { setItems([]); setLoading(false); return; }
      const missionsQuery = query(collection(db, "missions"), where(documentId(), "in", ids.slice(0, 30)));
      return onSnapshot(missionsQuery, (missionSnapshot) => {
        const byId = new Map(missionSnapshot.docs.map((entry) => [entry.id, { id: entry.id, ...entry.data() } as Mission]));
        setItems(assignments.flatMap((assignment) => { const mission = byId.get(assignment.missionId); return mission ? [{ ...assignment, mission }] : []; }));
        setLoading(false);
      });
    }, () => setLoading(false));
  }, [user]);
  return { items, loading };
}
