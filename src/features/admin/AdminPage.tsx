import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useEffect, useState } from "react";
import type { Submission } from "../../../shared/types";
import type { DeletionRequest } from "../../../shared/types";
import { Card, EmptyState, StatusNotice } from "../../design-system/components";
import { db } from "../../firebase/data";
import { functions } from "../../firebase/functions";
import { useAuth } from "../auth/AuthProvider";
import { ModerationCard } from "./ModerationCard";
import { ChallengeOperations } from "./ChallengeOperations";
import { AdminTabs, type AdminSection } from "./AdminTabs";
import { DeletionQueue } from "./DeletionQueue";
import "./admin.css";

export function AdminPage() {
  const { profile } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueError, setQueueError] = useState(false);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [deletionLoading, setDeletionLoading] = useState(true);
  const [deletionError, setDeletionError] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>("images");

  useEffect(() => onSnapshot(
    query(collection(db, "submissions"), where("kind", "==", "challenge"), where("status", "==", "pending"), orderBy("submittedAt", "desc"), limit(50)),
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

  useEffect(() => onSnapshot(
    query(collection(db, "deletionRequests"), where("status", "in", ["requested", "failed"]), orderBy("requestedAt", "desc"), limit(50)),
    (snapshot) => { setDeletionRequests(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as unknown as DeletionRequest)); setDeletionError(false); setDeletionLoading(false); },
    () => { setDeletionError(true); setDeletionLoading(false); }
  ), []);

  async function review(submission: Submission, decision: "approved" | "rejected", note?: string) { await httpsCallable(functions, "reviewSubmission")({ userId: submission.userId, missionId: submission.missionId, decision, reasonCode: decision === "rejected" ? "INVALID_EVIDENCE" : undefined, note }); }
  async function reviewDeletion(request: DeletionRequest, decision: "approved" | "rejected", note?: string) { await httpsCallable(functions, "reviewDataDeletion")({ uid: request.uid, decision, ...(note ? { note } : {}) }); }

  return <main className="page stack admin-page">
    <header className="admin-hero"><div><p className="eyebrow">AWS Community Day Guatemala</p><h1>Consola del evento</h1><p>Revisa solicitudes pendientes y administra la experiencia desde un solo lugar.</p></div><span className="admin-owner">Acceso del administrador</span></header>
    <section className="admin-stats" aria-label="Resumen administrativo"><div className="admin-stat"><span>Imágenes pendientes</span><strong>{loading ? "…" : submissions.length}</strong></div><div className="admin-stat"><span>Solicitudes de privacidad</span><strong>{deletionLoading ? "…" : deletionRequests.length}</strong></div><div className="admin-stat"><span>Cuenta responsable</span><strong>GuateGeeks</strong></div></section>
    <AdminTabs active={activeSection} onChange={setActiveSection} imageCount={submissions.length} deletionCount={deletionRequests.length} />
    {activeSection === "images" && <section role="tabpanel" className="stack"><div className="admin-section-heading"><h2>Imágenes pendientes</h2><p className="muted">Confirma que cada evidencia corresponda al reto antes de decidir.</p></div>{loading
      ? <Card><p role="status">Cargando bandeja de moderación…</p></Card>
      : queueError
        ? <StatusNotice tone="error">No pudimos cargar la bandeja de moderación.</StatusNotice>
        : submissions.length
          ? submissions.map((submission) => <ModerationCard key={submission.id} submission={submission} onReview={review} />)
          : <EmptyState title="Bandeja al día">No hay fotos pendientes de revisión.</EmptyState>}</section>}
    {activeSection === "privacy" && <section role="tabpanel" className="stack"><div className="admin-section-heading"><h2>Eliminación de datos</h2><p className="muted">Cada aprobación elimina definitivamente la cuenta y su información asociada.</p></div><DeletionQueue requests={deletionRequests} loading={deletionLoading} error={deletionError} onReview={reviewDeletion} /></section>}
    {activeSection === "configuration" && <section role="tabpanel" className="stack"><div className="admin-section-heading"><h2>Configuración</h2><p className="muted">Ajusta retos, créditos, escenarios y tracks del evento.</p></div>{profile?.role === "admin" && <ChallengeOperations role={profile.role} />}</section>}
  </main>;
}
