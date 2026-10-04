import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Submission } from "../../../shared/types";
import { Button, Card, EmptyState } from "../../design-system/components";
import { db } from "../../firebase/data";
import { functions } from "../../firebase/functions";
import { useAuth } from "../auth/AuthProvider";

export function AdminPage() {
  const { profile } = useAuth(); const [submissions, setSubmissions] = useState<Submission[]>([]);
  useEffect(() => onSnapshot(query(collection(db, "submissions"), where("status", "==", "pending"), orderBy("submittedAt", "desc"), limit(50)), (snap) => setSubmissions(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Submission))), []);
  async function review(submission: Submission, decision: "approved" | "rejected") { const note = decision === "rejected" ? prompt("Motivo breve del rechazo") ?? "Evidencia no válida" : undefined; await httpsCallable(functions, "reviewSubmission")({ userId: submission.userId, missionId: submission.missionId, decision, reasonCode: decision === "rejected" ? "INVALID_EVIDENCE" : undefined, note }); }
  return <main className="page stack"><p className="eyebrow">Operaciones del evento</p><h1>Consola</h1><Card><div className="row"><div className="grow"><h2>Moderación pendiente</h2><p className="muted">{submissions.length} evidencias esperan revisión</p></div><strong>{profile?.role}</strong></div></Card>{submissions.length ? submissions.map((submission) => <Card className="stack" key={submission.id}><div className="row"><strong className="grow">Misión {submission.missionId}</strong><span>{submission.provisionalPoints} pts</span></div><p className="muted">Participante: {submission.userId.slice(0, 8)}…</p><div className="cluster"><Button variant="primary" onClick={() => void review(submission, "approved")}><Check aria-hidden /> Aprobar</Button><Button variant="danger" onClick={() => void review(submission, "rejected")}><X aria-hidden /> Rechazar</Button></div></Card>) : <EmptyState title="Bandeja al día">No hay fotos pendientes de revisión.</EmptyState>}</main>;
}
