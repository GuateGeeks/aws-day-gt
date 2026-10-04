import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useEffect, useState } from "react";
import type { Submission } from "../../../shared/types";
import { Card, EmptyState, StatusNotice } from "../../design-system/components";
import { db } from "../../firebase/data";
import { functions } from "../../firebase/functions";
import { useAuth } from "../auth/AuthProvider";
import { ModerationCard } from "./ModerationCard";

export function AdminPage() {
  const { profile } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueError, setQueueError] = useState(false);

  useEffect(() => onSnapshot(
    query(collection(db, "submissions"), where("status", "==", "pending"), orderBy("submittedAt", "desc"), limit(50)),
    (snapshot) => {
      setSubmissions(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Submission));
      setQueueError(false);
      setLoading(false);
    },
    () => {
      setQueueError(true);
      setLoading(false);
    }
  ), []);

  async function review(submission: Submission, decision: "approved" | "rejected") { const note = decision === "rejected" ? prompt("Motivo breve del rechazo") ?? "Evidencia no válida" : undefined; await httpsCallable(functions, "reviewSubmission")({ userId: submission.userId, missionId: submission.missionId, decision, reasonCode: decision === "rejected" ? "INVALID_EVIDENCE" : undefined, note }); }

  return <main className="page stack">
    <p className="eyebrow">Operaciones del evento</p><h1>Consola</h1>
    <Card><div className="row"><div className="grow"><h2>Moderación pendiente</h2><p className="muted">{submissions.length} evidencias esperan revisión</p></div><strong>{profile?.role}</strong></div></Card>
    {loading
      ? <Card><p role="status">Cargando bandeja de moderación…</p></Card>
      : queueError
        ? <StatusNotice tone="error">No pudimos cargar la bandeja de moderación.</StatusNotice>
        : submissions.length
          ? submissions.map((submission) => <ModerationCard key={submission.id} submission={submission} onReview={review} />)
          : <EmptyState title="Bandeja al día">No hay fotos pendientes de revisión.</EmptyState>}
  </main>;
}
