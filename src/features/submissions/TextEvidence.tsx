import { httpsCallable } from "firebase/functions";
import { useState, type FormEvent } from "react";
import type { Mission } from "../../../shared/types";
import { validateEvidence } from "../../../shared/validation";
import { Button, Field, Input, StatusNotice, Textarea } from "../../design-system/components";
import { functions } from "../../firebase/functions";

export function TextEvidence({ mission }: { mission: Mission }) {
  const draftKey = `aws-day-gt.draft.${mission.id}`; const [value, setValue] = useState(() => localStorage.getItem(draftKey) ?? "");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); setMessage(""); let text: string;
    try { text = validateEvidence(mission.validation, value); } catch { setMessage("La respuesta no cumple con la longitud o formato solicitado."); return; }
    setBusy(true); try { await httpsCallable(functions, "submitTextMission")({ missionId: mission.id, operationId: crypto.randomUUID(), text }); localStorage.removeItem(draftKey); setMessage("¡Misión completada! Tus puntos ya están en el marcador."); }
    catch { setMessage("No pudimos enviar tu respuesta. Comprueba tu conexión e intenta de nuevo."); } finally { setBusy(false); }
  }
  const field = mission.evidenceType === "word" ? <Input id="evidence" value={value} onChange={(e) => setValue(e.target.value)} /> : <Textarea id="evidence" value={value} maxLength={mission.validation.maxLength} onChange={(e) => { setValue(e.target.value); localStorage.setItem(draftKey, e.target.value); }} />;
  return <form className="stack" onSubmit={submit}><Field id="evidence" label={mission.evidenceType === "word" ? "Tu palabra" : "Tu respuesta"} hint={`${value.length}${mission.validation.maxLength ? ` / ${mission.validation.maxLength}` : ""} caracteres`}>{field}</Field>{message && <StatusNotice tone={message.startsWith("¡") ? "success" : "error"}>{message}</StatusNotice>}<Button type="submit" variant="accent" block loading={busy}>Enviar evidencia</Button></form>;
}
