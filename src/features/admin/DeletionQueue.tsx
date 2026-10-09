import { AlertTriangle, ShieldCheck, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { DeletionRequest } from "../../../shared/types";
import { Button, Card, EmptyState, StatusNotice, Textarea } from "../../design-system/components";

type ReviewMode = "approved" | "rejected";

function requestDate(value: unknown): string {
  const date = value && typeof value === "object" && "toDate" in value ? (value as { toDate: () => Date }).toDate() : null;
  return date ? new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(date) : "Fecha pendiente";
}

export function DeletionQueue({ requests, loading, error, onReview }: { requests: DeletionRequest[]; loading: boolean; error: boolean; onReview: (request: DeletionRequest, decision: ReviewMode, note?: string) => Promise<void> }) {
  const [selected, setSelected] = useState<DeletionRequest | null>(null);
  const [mode, setMode] = useState<ReviewMode>("approved");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewError, setReviewError] = useState(false);

  function open(request: DeletionRequest, nextMode: ReviewMode) {
    setSelected(request); setMode(nextMode); setReason(""); setConfirmed(false); setReviewError(false);
  }
  function close() { if (!busy) setSelected(null); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected || (mode === "approved" && !confirmed) || (mode === "rejected" && reason.trim().length < 3)) return;
    setBusy(true); setReviewError(false);
    try { await onReview(selected, mode, mode === "rejected" ? reason.trim() : undefined); setSelected(null); }
    catch { setReviewError(true); }
    finally { setBusy(false); }
  }

  if (loading) return <Card><p role="status">Cargando solicitudes de eliminación…</p></Card>;
  if (error) return <StatusNotice tone="error">No pudimos cargar las solicitudes de eliminación.</StatusNotice>;
  if (!requests.length) return <EmptyState title="Privacidad al día">No hay solicitudes de eliminación pendientes.</EmptyState>;

  return <>
    <div className="admin-request-list">{requests.map((request) => <Card className="admin-request" key={request.uid}>
      <div className="admin-request__identity"><span className="admin-request__icon"><ShieldCheck aria-hidden /></span><div><h3>{request.alias}</h3><p>{request.emailMasked} · {requestDate(request.requestedAt)}</p><span className={`admin-status admin-status--${request.status}`}>{request.status === "failed" ? "Requiere reintento" : "Pendiente"}</span></div></div>
      <div className="admin-request__actions"><Button variant="secondary" onClick={() => open(request, "rejected")}><X aria-hidden size={18} /> Rechazar</Button><Button variant="danger" onClick={() => open(request, "approved")}><Trash2 aria-hidden size={18} /> Revisar y eliminar</Button></div>
    </Card>)}</div>
    {selected && <div className="admin-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <form className="admin-dialog stack" role="dialog" aria-modal="true" aria-labelledby="deletion-dialog-title" onSubmit={submit}>
        <span className={`admin-dialog__icon ${mode === "approved" ? "admin-dialog__icon--danger" : ""}`}><AlertTriangle aria-hidden /></span>
        <div><p className="eyebrow">{mode === "approved" ? "Acción irreversible" : "Rechazar solicitud"}</p><h2 id="deletion-dialog-title">{mode === "approved" ? `Eliminar datos de ${selected.alias}` : `Rechazar solicitud de ${selected.alias}`}</h2></div>
        {mode === "approved" ? <><p>Se eliminarán la cuenta, el perfil, el progreso, el ranking, las conexiones y todas las imágenes de esta persona.</p><label className="check-row"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>Comprendo que esta acción es irreversible.</span></label></> : <label className="stack"><strong>Motivo del rechazo</strong><Textarea required minLength={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explica brevemente qué debe validar la persona." /></label>}
        {reviewError && <StatusNotice tone="error">No pudimos completar esta decisión. Intenta nuevamente.</StatusNotice>}
        <div className="admin-dialog__actions"><Button type="button" variant="secondary" disabled={busy} onClick={close}>Cancelar</Button><Button type="submit" variant={mode === "approved" ? "danger" : "primary"} loading={busy} disabled={mode === "approved" ? !confirmed : reason.trim().length < 3}>{mode === "approved" ? "Confirmar eliminación definitiva" : "Confirmar rechazo"}</Button></div>
      </form>
    </div>}
  </>;
}
